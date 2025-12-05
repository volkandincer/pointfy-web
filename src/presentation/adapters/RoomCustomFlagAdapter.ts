/**
 * RoomCustomFlagAdapter
 * Adapter to convert between Domain RoomCustomFlag and Presentation RoomCustomFlag
 */

import type { RoomCustomFlag as DomainRoomCustomFlag } from "../../domain/entities/RoomCustomFlag";
import type { RoomCustomFlag as PresentationRoomCustomFlag } from "@/interfaces/RetroActionItem.interface";

export class RoomCustomFlagAdapter {
  static toPresentation(domain: DomainRoomCustomFlag): PresentationRoomCustomFlag {
    return {
      id: domain.id,
      room_id: domain.roomId,
      flag_name: domain.flagName,
      flag_color: domain.flagColor,
      created_by_key: domain.createdBy,
      created_at: domain.createdAt.toISOString(),
    };
  }

  static toPresentationArray(
    domains: DomainRoomCustomFlag[]
  ): PresentationRoomCustomFlag[] {
    return domains.map((domain) => this.toPresentation(domain));
  }
}

