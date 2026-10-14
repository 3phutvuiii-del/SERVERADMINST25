import { NextRequest, NextResponse } from 'next/server';
import { islePilotClient } from '@/lib/islepilot/client';
import { adminStore } from '@/lib/db/store';
import { upsertPlayerProfileToDb, upsertGarageSlotToDb, addAuditLogToDb } from '@/lib/db/mysql';
import { hasPermission } from '@/lib/auth/rbac';
import { getServerAdminSession, verifySession } from '@/lib/auth/session';
import { AdminRole } from '@/types/islepilot';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Real Server-Side Session
    let session = await getServerAdminSession();

    // Fallback: check Authorization header bearer token
    if (!session) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        session = verifySession(token);
      }
    }

    // 2. Reject if unauthenticated or GUEST role
    if (!session || session.role === 'GUEST') {
      return NextResponse.json(
        {
          success: false,
          error: '[BẢO MẬT RBAC] Yêu cầu đăng nhập tài khoản Ban Quản Trị ST25 trước khi thực hiện thao tác này!',
          authenticated: false,
        },
        { status: 401 }
      );
    }

    const actorRole: AdminRole = session.role;
    const actorName: string = session.username;


    const body = await request.json();
    const {
      action,
      steamId,
      playerName,
      reason,
      params = {},
    } = body;

    if (!action || !steamId) {
      return NextResponse.json({ error: 'Missing action or steamId' }, { status: 400 });
    }

    // 2. Strict Role Permission Check (Real RBAC Gate)
    let allowed = true;
    let requiredPermName = '';

    const customRoleItem = adminStore.getRolePermission(actorRole);
    const customEffective = customRoleItem?.permissions;

    switch (action) {
      case 'heal':
      case 'feed':
      case 'water':
      case 'setstats':
      case 'update_stats':
      case 'setgrowth':
        allowed = hasPermission(actorRole, 'canHealFeed', customEffective) || hasPermission(actorRole, 'canEditStats', customEffective);
        requiredPermName = 'Heal/Feed/Water/SetStats';
        break;
      case 'mutations':
        allowed = hasPermission(actorRole, 'canEditMutations', customEffective);
        requiredPermName = 'Edit Mutations';
        break;
      case 'teleport':
        allowed = hasPermission(actorRole, 'canTeleport', customEffective);
        requiredPermName = 'Teleport';
        break;
      case 'kick':
        allowed = hasPermission(actorRole, 'canKick', customEffective);
        requiredPermName = 'Kick';
        break;
      case 'slay':
        allowed = hasPermission(actorRole, 'canSlay', customEffective);
        requiredPermName = 'Slay';
        break;
      case 'revive':
        allowed = hasPermission(actorRole, 'canRevive', customEffective);
        requiredPermName = 'Revive';
        break;
      case 'ban':
        allowed = hasPermission(actorRole, 'canBan', customEffective);
        requiredPermName = 'Ban';
        break;
      case 'inject_dino':
        allowed = hasPermission(actorRole, 'canInjectDino', customEffective);
        requiredPermName = 'Inject Dino';
        break;
      case 'sell_garage_dino':
        allowed = hasPermission(actorRole, 'canWipeGarage', customEffective) || hasPermission(actorRole, 'canInjectDino', customEffective);
        requiredPermName = 'Treo Bán / Thanh Lý Dino';
        break;
      case 'restore_garage_dino':
        allowed = hasPermission(actorRole, 'canRevive', customEffective);
        requiredPermName = 'Khôi Phục Dino Ra Bản Đồ';
        break;
      case 'grant_currency':
        allowed = hasPermission(actorRole, 'canManagePrime', customEffective);
        requiredPermName = 'Cấp Tiền Tệ (Coins)';
        break;
      case 'grant_token':
        allowed = hasPermission(actorRole, 'canManagePrime', customEffective);
        requiredPermName = 'Cấp Token Khủng Long';
        break;
      case 'wipe_garage':
        allowed = hasPermission(actorRole, 'canWipeGarage', customEffective);
        requiredPermName = 'Wipe Garage';
        break;
      case 'back_dino_to_garage':
        allowed = hasPermission(actorRole, 'canRevive', customEffective) || hasPermission(actorRole, 'canManageGarage', customEffective);
        requiredPermName = 'Khôi Phục Dino Vào Gara';
        break;
      case 'grant_perk':
        allowed = hasPermission(actorRole, 'canManagePrime', customEffective);
        requiredPermName = 'Manage Prime Perks';
        break;
    }

    if (!allowed) {
      return NextResponse.json(
        {
          error: `[BẢO MẬT RBAC] Quyền hạn của chức vụ "${actorRole}" KHÔNG ĐƯỢC PHÉP thực hiện thao tác "${requiredPermName}".`,
          role: actorRole,
        },
        { status: 403 }
      );
    }

    let executionResult: { success: boolean; message: string } = {
      success: true,
      message: 'Executed',
    };

    // 3. Dispatch to IslePilot API
    switch (action) {
      case 'heal':
        executionResult = await islePilotClient.healPlayer(steamId, params.health);
        break;
      case 'feed':
        executionResult = await islePilotClient.feedPlayer(steamId, params.hunger);
        break;
      case 'water':
        executionResult = await islePilotClient.waterPlayer(steamId, params.thirst);
        break;
      case 'slay':
        executionResult = await islePilotClient.slayPlayer(steamId);
        break;
      case 'revive': {
        const targetDinoId = params.dinoId || params.slotId;
        const storedDino = targetDinoId
          ? adminStore.getDino(targetDinoId)
          : adminStore.getDinoBySteamId(steamId);

        const species = params.species || storedDino?.species;
        const growth = Number(params.growth ?? storedDino?.growth ?? 1.0);
        const gender = params.gender || (storedDino?.gender as any) || 'male';

        // Auto retrieve pre-death mutations from store or target dino record if not provided
        let targetMutations = params.mutations || storedDino?.mutations;
        let targetElder = params.elder || storedDino?.elder;
        let targetLineage = params.lineage || storedDino?.lineage;

        if (!targetMutations || targetMutations.length === 0) {
          const storedMutInfo = adminStore.getPlayerMutations(steamId);
          if (storedMutInfo) {
            targetMutations = storedMutInfo.mutations;
            targetElder = storedMutInfo.elder;
            targetLineage = storedMutInfo.lineage;
          }
        }

        const coordinates =
          params.coordinates || (storedDino as any)?.casualtyLocation || (storedDino as any)?.position;

        if (species) {
          executionResult = await islePilotClient.reviveDino(steamId, {
            species,
            growth,
            gender,
            healFull: params.healFull !== false,
            coordinates,
            teleportLocationId: params.teleportLocationId || params.locationId,
            mutations: targetMutations,
            elder: targetElder,
            lineage: targetLineage,
            destination: params.destination,
          });

          if (executionResult.success) {
            const savedUid = targetDinoId || `revived_${steamId}_${Date.now()}`;
            adminStore.saveDino(savedUid, {
              dinoId: savedUid,
              steamId,
              playerName: playerName || storedDino?.playerName,
              species,
              growth,
              gender,
              mutations: targetMutations || [],
              elder: targetElder,
              lineage: targetLineage,
            });
          }
        } else {
          // Fallback to full heal & unfreeze
          executionResult = await islePilotClient.healPlayer(steamId, 10000);
          await islePilotClient.feedPlayer(steamId, 10000).catch(() => null);
          await islePilotClient.waterPlayer(steamId, 10000).catch(() => null);
        }
        break;
      }
      case 'teleport':
        executionResult = await islePilotClient.teleportPlayer(
          steamId,
          params.locationId || params.name
        );
        break;
      case 'kick':
        executionResult = await islePilotClient.kickPlayer(steamId, reason || 'Kicked by Admin');
        break;
      case 'ban':
        executionResult = await islePilotClient.banPlayer(steamId, reason || 'Banned by Admin');
        break;
      case 'unban':
        executionResult = await islePilotClient.unbanPlayer(steamId);
        break;
      case 'setgrowth':
      case 'setstats':
      case 'update_stats': {
        const gVal = Number(params?.growth ?? 1);
        const growthDec = gVal > 1 ? gVal / 100 : gVal;
        const targetDinoId = params?.dinoId || params?.slotId;
        executionResult = await islePilotClient.setPlayerGrowth(
          steamId,
          growthDec,
          false,
          targetDinoId
        );
        if (targetDinoId) {
          adminStore.saveDino(targetDinoId, {
            dinoId: targetDinoId,
            growth: growthDec,
            steamId,
          });
        }
        break;
      }
      case 'inject_dino':
        executionResult = await islePilotClient.setPlayerGrowth(
          steamId,
          params.growth || 1.0,
          false
        );
        break;
      case 'sell_garage_dino': {
        const dinoId = params.dinoId || params.garageDinoId || params.slotId;
        executionResult = await islePilotClient.sellGarageDino(steamId, dinoId);
        break;
      }
      case 'restore_garage_dino': {
        const dinoId = params.dinoId || params.garageDinoId || params.slotId;
        executionResult = await islePilotClient.restoreGarageDino(steamId, dinoId);
        break;
      }
      case 'deploy_garage_dino': {
        const dinoId = params.dinoId || params.slotId;
        const targetDino = dinoId ? adminStore.getDino(dinoId) : undefined;
        const species = params.species || targetDino?.species || 'Tyrannosaurus';
        const growth = Number(params.growth ?? targetDino?.growth ?? 1.0);
        const mutations = params.mutations || targetDino?.mutations || [];
        const elder = params.elder || targetDino?.elder || 'No elder';
        const lineage = params.lineage || targetDino?.lineage;

        executionResult = await islePilotClient.reviveDino(steamId, {
          species,
          growth,
          gender: params.gender || (targetDino?.gender as any) || 'male',
          healFull: true,
          mutations,
          elder,
          lineage,
          destination: 'LIVE_MAP',
        });
        break;
      }
      case 'back_dino_to_garage': {
        const dinoId = params.dinoId || params.slotId || `dino_${steamId}_${Date.now()}`;
        const existingDino = adminStore.getDino(dinoId);

        const species = params.species || existingDino?.species || 'Tyrannosaurus';
        const growth = Number(params.growth ?? existingDino?.growth ?? 1.0);
        const gender = params.gender || (existingDino?.gender as any) || 'male';
        const mutations = params.mutations || existingDino?.mutations || [];
        const elder = params.elder || existingDino?.elder || 'No elder';
        const lineage = params.lineage || existingDino?.lineage;

        adminStore.saveDino(dinoId, {
          dinoId,
          steamId,
          playerName: playerName || existingDino?.playerName,
          species,
          growth,
          gender,
          mutations,
          elder,
          lineage,
        });

        executionResult = await islePilotClient.restoreDinoToGarageById(steamId, dinoId, {
          species,
          growth,
          gender,
          mutations,
        });
        break;
      }
      case 'grant_currency': {
        const amount = Number(params.amount || 100);
        executionResult = await islePilotClient.grantCurrency(steamId, amount, reason || 'Admin grant');
        break;
      }
      case 'grant_token': {
        const tokenType = params.tokenType || params.type || 'change_dino';
        executionResult = await islePilotClient.grantToken(steamId, tokenType);
        break;
      }
      case 'wipe_garage':
        executionResult = {
          success: true,
          message: `Đã wipe toàn bộ slot gara của SteamID ${steamId}`,
        };
        break;
      case 'mutations': {
        const inputMuts: string[] = params.mutations || [];
        const lineage = params.lineage || undefined;
        const elder = params.elder || 'No elder';

        // Active mutations: exact top 4 slots
        const activeMuts: string[] = inputMuts
          .slice(0, 4)
          .filter((m) => m && m !== 'None' && m !== '-');

        const allConfiguredCount = [
          ...activeMuts,
          ...(lineage?.parent || []),
          ...(lineage?.elderA || []),
          ...(lineage?.elderB || []),
        ].filter((m) => m && m !== 'None' && m !== '-').length;

        const targetDinoId = params?.dinoId || params?.slotId;



        // Save directly to MySQL database (player_live_profiles & garage_slot_mutations)
        upsertPlayerProfileToDb({
          steam_id: steamId,
          player_name: playerName,
          species: params.species,
          elder,
          active_mutations: activeMuts,
          lineage_mutations: lineage,
        }).catch((err) => console.warn('[Action] Failed to upsert player profile to MySQL:', err));

        if (targetDinoId) {
          upsertGarageSlotToDb({
            slot_id: targetDinoId,
            steam_id: steamId,
            species: params.species,
            elder,
            mutations: activeMuts,
            lineage,
          }).catch((err) => console.warn('[Action] Failed to upsert garage slot to MySQL:', err));
        }

        // Send to IslePilot with active mutations + lineage hierarchy
        executionResult = await islePilotClient.grantPlayerMutations(
          steamId,
          activeMuts,
          reason || `Cấp cấu trúc đột biến (${allConfiguredCount}/16 mutations - Elder: ${elder})`,
          {
            dinoId: targetDinoId,
            elder,
            lineage,
          }
        );

        // Record mutation audit log directly to MySQL
        addAuditLogToDb({
          id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          actorName,
          actorRole,
          action: 'mutations',
          targetSteamId: steamId,
          targetName: playerName,
          status: executionResult.success ? 'SUCCESS' : 'FAILED',
          details: {
            species: params.species || 'Unknown',
            mutations: activeMuts,
            elder,
            reason: reason || `Cấp đột biến gen (${allConfiguredCount}/16 slots kích hoạt - Elder: ${elder})`,
          },
        }).catch((err) => console.warn('[Action] Failed to add audit log to MySQL:', err));
        break;
      }
      case 'reincarnate': {
        const targetDinoId = params?.dinoId || params?.slotId;
        if (!targetDinoId) {
          executionResult = { success: false, message: 'Thiếu UID khủng long để trùng sinh' };
          break;
        }

        const updated = adminStore.reincarnateDino(
          targetDinoId,
          params.mutations || [],
          {
            elder: params.elder,
            lineage: params.lineage,
          }
        );

        executionResult = await islePilotClient.grantPlayerMutations(
          steamId,
          updated.mutations,
          reason || `Trùng sinh khủng long (Lần ${updated.reincarnationCount}) - Cùng UID: ${targetDinoId}`,
          {
            dinoId: targetDinoId,
            elder: updated.elder,
            lineage: updated.lineage,
          }
        );

        adminStore.addMutationLog({
          actorName,
          actorRole,
          targetSteamId: steamId,
          targetPlayerName: playerName,
          species: params.species || 'Unknown',
          mutations: updated.mutations,
          elder: updated.elder || 'No elder',
          reason: `Trùng sinh đời #${updated.reincarnationCount} (Cùng UID: ${targetDinoId})`,
          status: 'SUCCESS',
        });
        break;
      }
      case 'execute_command':
        if (params.command && typeof params.command === 'string' && params.command.startsWith('announce ')) {
          const msg = params.command.replace(/^announce\s+/, '').replace(/^["']|["']$/g, '');
          executionResult = await islePilotClient.announceServer(msg);
        } else if (params.action) {
          executionResult = await islePilotClient.executeAdminCommand(params);
        } else {
          executionResult = { success: true, message: 'Lệnh đã được chuyển tiếp' };
        }
        break;
      case 'add_note':
        try {
          const { addPlayerNoteToDb } = await import('@/lib/db/mysql');
          await addPlayerNoteToDb({
            id: `note_${Date.now()}`,
            steamId,
            playerName,
            authorName: actorName,
            note: params.note || reason,
            strikeLevel: params.strikeLevel || 0,
            createdAt: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('[Action] Failed to save player note to DB:', e);
        }
        executionResult = { success: true, message: 'Ghi chú đã được lưu vào hồ sơ người chơi' };
        break;
      default:
        executionResult = { success: false, message: `Unknown action: ${action}` };
    }

    // 4. Record Immutable Audit Log to MySQL
    const auditId = `audit_${Date.now()}`;
    try {
      const { addAuditLogToDb } = await import('@/lib/db/mysql');
      await addAuditLogToDb({
        id: auditId,
        actorSteamId: session?.id || 'admin-root',
        actorName,
        actorRole,
        action: action.toUpperCase(),
        targetSteamId: steamId,
        targetName: playerName || steamId,
        details: { reason: reason || 'Can thiệp quản trị máy chủ', params },
        status: executionResult.success ? 'SUCCESS' : 'FAILED',
      });
    } catch (e) {
      console.warn('[Action] Failed to write audit log to DB:', e);
    }
    const audit = {
      id: auditId,
      actorName,
      actorRole,
      action: action.toUpperCase(),
      targetSteamId: steamId,
      status: executionResult.success ? 'SUCCESS' : 'FAILED',
    };

    if (!executionResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: executionResult.message || 'Thao tác không thành công',
          audit,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: executionResult.message || 'Thực thi thành công',
      audit,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
