import React from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '../components/typography';
import { AppIcon } from '../components/AppIcon';
import { colors, radius, spacing } from '../theme';
import { useAuthGuard } from '../hooks/useAuthGuard';
import {
  createSupportConversation,
  listSupportConversations,
  replyToSupportConversation,
  type SupportConversation,
} from '../services/supportService';

export function SupportInboxScreen() {
  const { t } = useTranslation();
  useAuthGuard();
  const [items, setItems] = React.useState<SupportConversation[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [reply, setReply] = React.useState('');
  const [newSubject, setNewSubject] = React.useState('');
  const [newMessage, setNewMessage] = React.useState('');
  const [newRole, setNewRole] = React.useState<'buyer' | 'seller'>('buyer');

  const load = React.useCallback(() => {
    void listSupportConversations().then((rows) => {
      setItems(rows);
      setSelectedId((current) => current ?? rows[0]?.id ?? null);
    }).catch(() => undefined);
  }, []);
  React.useEffect(load, [load]);
  const selected = items.find((item) => item.id === selectedId);

  const send = async () => {
    if (!selected || !reply.trim()) return;
    const updated = await replyToSupportConversation(selected.id, reply.trim());
    setItems((rows) => rows.map((row) => row.id === updated.id ? updated : row));
    setReply('');
  };

  const createConversation = async () => {
    if (!newSubject.trim() || !newMessage.trim()) return;
    const created = await createSupportConversation({
      subject: newSubject.trim(),
      body: newMessage.trim(),
      userRoleContext: newRole,
    });
    setItems((rows) => [created, ...rows]);
    setSelectedId(created.id);
    setNewSubject('');
    setNewMessage('');
  };

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AppIcon name="chevronBack" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('screens.support.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.newConversation}>
        <View style={styles.rolePicker}>
          {(['buyer', 'seller'] as const).map((role) => (
            <Pressable
              key={role}
              onPress={() => setNewRole(role)}
              style={[styles.roleOption, newRole === role && styles.roleOptionActive]}
            >
              <Text style={styles.roleOptionText}>
                {t(`screens.support.${role}Context`)}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={newSubject}
          onChangeText={setNewSubject}
          placeholder={t('screens.support.subject')}
          style={styles.newInput}
        />
        <View style={styles.newMessageRow}>
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder={t('screens.support.message')}
            style={[styles.newInput, styles.newMessageInput]}
          />
          <Pressable style={styles.newSend} onPress={() => void createConversation()}>
            <Text style={styles.sendText}>{t('screens.support.start')}</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView horizontal contentContainerStyle={styles.tabs} showsHorizontalScrollIndicator={false}>
        {items.map((item) => (
          <Pressable key={item.id} style={[styles.tab, item.id === selectedId && styles.tabActive]} onPress={() => setSelectedId(item.id)}>
            <Text style={styles.tabTitle} numberOfLines={1}>{item.subject}</Text>
            <Text style={styles.tabMeta}>{item.userRoleContext}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView style={styles.thread} contentContainerStyle={styles.threadContent}>
        {!selected ? <Text style={styles.empty}>{t('screens.support.empty')}</Text> : null}
        {selected?.messages.map((message) => (
          <View key={message.id} style={[styles.message, message.senderRole === 'admin' ? styles.official : styles.mine]}>
            <Text style={styles.role}>{message.senderRole === 'admin' ? t('screens.support.official') : t('screens.support.you')}</Text>
            <Text style={styles.body}>{message.body}</Text>
          </View>
        ))}
      </ScrollView>
      {selected ? (
        <View style={styles.composer}>
          <TextInput value={reply} onChangeText={setReply} placeholder={t('screens.support.reply')} style={styles.input} multiline />
          <Pressable style={styles.send} onPress={() => void send()}><Text style={styles.sendText}>{t('common.send')}</Text></Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  header: {
    minHeight: 52,
    paddingHorizontal: spacing.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  headerTitle: { color: colors.text, fontWeight: '700', fontSize: 17 },
  headerSpacer: { width: 36 },
  newConversation: {
    marginHorizontal: spacing.screenPadding,
    marginBottom: 8,
    padding: 10,
    gap: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
  },
  rolePicker: { flexDirection: 'row', gap: 6 },
  roleOption: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  roleOptionActive: { backgroundColor: colors.brand },
  roleOptionText: { color: colors.text, fontSize: 12 },
  newInput: {
    minHeight: 38,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
  },
  newMessageRow: { flexDirection: 'row', gap: 8 },
  newMessageInput: { flex: 1 },
  newSend: {
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
  },
  tabs: { gap: 8, paddingHorizontal: spacing.screenPadding, paddingVertical: 8 },
  tab: { width: 170, padding: 8, borderRadius: radius.md, backgroundColor: colors.card },
  tabActive: { borderColor: colors.text, borderWidth: 1 },
  tabTitle: { fontWeight: '700' },
  tabMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  thread: { flex: 1 },
  threadContent: { gap: 8, padding: spacing.screenPadding },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 24 },
  message: { maxWidth: '85%', padding: 8, borderRadius: radius.md },
  official: { alignSelf: 'flex-start', backgroundColor: colors.card },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.brand3 },
  role: { color: colors.muted, fontSize: 11, marginBottom: 3 },
  body: { color: colors.text },
  composer: { flexDirection: 'row', gap: 8, padding: spacing.screenPadding, borderTopWidth: 1, borderTopColor: colors.line },
  input: { flex: 1, minHeight: 42, maxHeight: 100, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 8, paddingVertical: 4 },
  send: { alignSelf: 'flex-end', backgroundColor: colors.brand, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 8 },
  sendText: { fontWeight: '700' },
});
