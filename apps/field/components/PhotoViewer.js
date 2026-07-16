import React from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

// Full-screen photo viewer: tap anywhere to close. `photo` is
// { url, title, takenAt } — takenAt is a pre-formatted display string, shown
// prominently because photos are proof-of-work and the timestamp is the point.
export default function PhotoViewer({ photo, onClose }) {
  return (
    <Modal visible={!!photo} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {photo?.url ? (
          <Image source={{ uri: photo.url }} style={styles.img} resizeMode="contain" />
        ) : null}
        <View style={styles.caption}>
          {photo?.title ? <Text style={styles.title} numberOfLines={2}>{photo.title}</Text> : null}
          <View style={{ alignItems: 'flex-end', flex: 0 }}>
            <Text style={styles.takenLabel}>TAKEN</Text>
            <Text style={styles.taken}>{photo?.takenAt || 'Unknown'}</Text>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(20,15,11,.94)',
    justifyContent: 'center', padding: 14,
  },
  img: { flex: 1, width: '100%' },
  caption: {
    backgroundColor: '#fff', borderRadius: 13, padding: 13, marginTop: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  },
  title: { flex: 1, fontSize: 13.5, fontWeight: '600', color: '#2a211b', lineHeight: 18 },
  takenLabel: { fontSize: 9.5, letterSpacing: 0.8, fontWeight: '700', color: '#a1927f' },
  taken: { fontSize: 14.5, fontWeight: '800', color: '#b85618', marginTop: 1, fontVariant: ['tabular-nums'] },
});
