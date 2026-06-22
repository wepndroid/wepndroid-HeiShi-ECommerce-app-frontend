import type { InboxNotificationDto, NotificationGroupDto } from '../api/types';
import type { UiInboxNotification, UiNotificationGroup } from '../types';

const GROUP_ICONS: Record<UiNotificationGroup['category'], UiNotificationGroup['icon']> = {
  system: 'bell',
  order: 'package',
  follow: 'star',
};

export function mapNotificationGroupDtoToUi(dto: NotificationGroupDto): UiNotificationGroup {
  return {
    category: dto.category,
    unreadCount: dto.unreadCount,
    previewTitle: dto.previewTitle,
    previewBody: dto.previewBody,
    timeLabel: dto.lastAt ?? '',
    icon: GROUP_ICONS[dto.category],
  };
}

export function mapInboxNotificationDtoToUi(dto: InboxNotificationDto): UiInboxNotification {
  return {
    id: dto.id,
    category: dto.category,
    title: dto.title,
    body: dto.body,
    timeLabel: dto.createdAt ?? '',
    unread: dto.unread,
    actionType: dto.actionType,
    actionRef: dto.actionRef,
  };
}
