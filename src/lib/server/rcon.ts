import net from 'net';
import { islePilotClient } from '@/lib/islepilot/client';

const SERVERDATA_AUTH = 3;
const SERVERDATA_AUTH_RESPONSE = 2;
const SERVERDATA_EXECCOMMAND = 2;
const SERVERDATA_RESPONSE_VALUE = 0;

interface RconConfig {
  host: string;
  port: number;
  password?: string;
  timeoutMs?: number;
}

export class TheIsleRconClient {
  private host: string;
  private port: number;
  private password?: string;
  private timeoutMs: number;
  private lastDirectFailureTime = 0;

  constructor(config?: Partial<RconConfig>) {
    this.host = config?.host || process.env.THEISLE_RCON_HOST || '127.0.0.1';
    this.port = Number(config?.port || process.env.THEISLE_RCON_PORT || 8888);
    this.password = config?.password || process.env.THEISLE_RCON_PASSWORD || '';
    this.timeoutMs = config?.timeoutMs || 2000;
  }

  /**
   * Execute command directly via RCON TCP Socket.
   * If direct RCON is unreachable, falls back to IslePilot command API.
   */
  async execute(command: string): Promise<{ success: boolean; response: string; source: 'direct_rcon' | 'islepilot_fallback' }> {
    const now = Date.now();
    let directErrorMessage = '';

    // Circuit breaker: If direct RCON failed recently, skip direct attempt
    if (now - this.lastDirectFailureTime > 15000) {
      try {
        const response = await this.executeDirect(command);
        return { success: true, response, source: 'direct_rcon' };
      } catch (directErr: any) {
        this.lastDirectFailureTime = Date.now();
        directErrorMessage = directErr?.message || String(directErr);
        console.warn(`[RCON Direct Failed, falling back to IslePilot]:`, directErrorMessage);
      }
    }

    try {
      const fallbackRes = await islePilotClient.executeAdminCommand({
        action: 'execute_command',
        command,
      });
      return {
        success: fallbackRes.success,
        response: fallbackRes.message,
        source: 'islepilot_fallback',
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        response: `Cả RCON trực tiếp và IslePilot đều thất bại: ${directErrorMessage} | ${fallbackErr?.message}`,
        source: 'direct_rcon',
      };
    }
  }

  private executeDirect(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.password) {
        return reject(new Error('Chưa cấu hình mật khẩu RCON (THEISLE_RCON_PASSWORD)'));
      }

      const socket = new net.Socket();
      let reqId = 1;
      let authenticated = false;
      let responseBuffer = Buffer.alloc(0);
      let timer: NodeJS.Timeout;

      const cleanup = () => {
        clearTimeout(timer);
        socket.removeAllListeners();
        socket.destroy();
      };

      timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Hết thời gian chờ kết nối RCON (${this.timeoutMs}ms)`));
      }, this.timeoutMs);

      socket.connect(this.port, this.host, () => {
        // Send Auth Packet
        const authPacket = this.encodePacket(reqId++, SERVERDATA_AUTH, this.password || '');
        socket.write(authPacket);
      });

      socket.on('data', (chunk) => {
        responseBuffer = Buffer.concat([responseBuffer, chunk]);

        while (responseBuffer.length >= 12) {
          const packetSize = responseBuffer.readInt32LE(0);
          const totalLength = packetSize + 4;
          if (responseBuffer.length < totalLength) break;

          const packet = responseBuffer.subarray(0, totalLength);
          responseBuffer = responseBuffer.subarray(totalLength);

          const id = packet.readInt32LE(4);
          const type = packet.readInt32LE(8);
          const bodyBytes = packet.subarray(12, packet.length - 2);
          const body = bodyBytes.toString('utf8');

          if (!authenticated) {
            if (type === SERVERDATA_AUTH_RESPONSE) {
              if (id === -1) {
                cleanup();
                return reject(new Error('Sai mật khẩu RCON server'));
              }
              authenticated = true;
              // Authenticated successfully! Now send actual command
              const cmdPacket = this.encodePacket(reqId++, SERVERDATA_EXECCOMMAND, command);
              socket.write(cmdPacket);
            }
          } else {
            if (type === SERVERDATA_RESPONSE_VALUE || type === SERVERDATA_EXECCOMMAND) {
              cleanup();
              return resolve(body);
            }
          }
        }
      });

      socket.on('error', (err) => {
        cleanup();
        reject(err);
      });

      socket.on('close', () => {
        cleanup();
      });
    });
  }

  private encodePacket(id: number, type: number, body: string): Buffer {
    const bodyBuf = Buffer.from(body, 'utf8');
    const size = 4 + 4 + bodyBuf.length + 2; // id (4) + type (4) + body + 2 null bytes
    const buf = Buffer.alloc(4 + size);

    buf.writeInt32LE(size, 0);
    buf.writeInt32LE(id, 4);
    buf.writeInt32LE(type, 8);
    bodyBuf.copy(buf, 12);
    buf.writeInt8(0, 12 + bodyBuf.length);
    buf.writeInt8(0, 12 + bodyBuf.length + 1);

    return buf;
  }
}

export const theIsleRcon = new TheIsleRconClient();
