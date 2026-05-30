import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import dayjs from 'dayjs';
import { Linking } from 'react-native';
import { Document } from '@/types';
import { useDocuments, useUploadDocument } from '@/hooks/useDocuments';
import Colors from '@/constants/colors';

interface DocumentsSheetProps {
  sheetRef: React.RefObject<BottomSheet | null>;
  tripId: string;
}

function docIcon(type: string): keyof typeof Ionicons.glyphMap {
  if (type.startsWith('image/')) return 'image-outline';
  if (type === 'application/pdf') return 'document-text-outline';
  return 'document-outline';
}

function docIconColor(type: string): string {
  if (type.startsWith('image/')) return Colors.accent.teal;
  if (type === 'application/pdf') return Colors.status.error;
  return Colors.text.secondary;
}

export default function DocumentsSheet({ sheetRef, tripId }: DocumentsSheetProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { data: documents = [], isLoading } = useDocuments(tripId);
  const { mutateAsync: uploadDoc } = useUploadDocument(tripId);

  const doUpload = async (uri: string, fileName: string, mimeType: string) => {
    setIsUploading(true);
    try {
      const result = await uploadDoc({ uri, fileName, mimeType });
      if (!result) throw new Error('Upload failed');
    } catch (e) {
      Alert.alert('Upload failed', (e as Error).message ?? 'Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await doUpload(
        asset.uri,
        asset.fileName ?? `photo_${Date.now()}.jpg`,
        asset.mimeType ?? 'image/jpeg',
      );
    }
  };

  const handlePickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      await doUpload(asset.uri, asset.name ?? `doc_${Date.now()}.pdf`, 'application/pdf');
    }
  };

  const handleOpen = (doc: Document) => {
    Linking.openURL(doc.url);
  };

  const renderItem = ({ item }: { item: Document }) => (
    <TouchableOpacity style={styles.docRow} onPress={() => handleOpen(item)} activeOpacity={0.75}>
      <View style={styles.docIconWrap}>
        <Ionicons name={docIcon(item.type)} size={20} color={docIconColor(item.type)} />
      </View>
      <View style={styles.docMeta}>
        <Text style={styles.docName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.docSub}>
          {dayjs(item.created_at).format('MMM D, YYYY')}
        </Text>
      </View>
      <Ionicons name="open-outline" size={16} color={Colors.neutral.placeholder} />
    </TouchableOpacity>
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['70%']}
      enablePanDownToClose
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <View style={styles.inner}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Documents</Text>
          <View style={styles.uploadBtns}>
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={handlePickImage}
              disabled={isUploading}
            >
              <Ionicons name="image-outline" size={16} color={Colors.primary.coral} />
              <Text style={styles.uploadBtnText}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={handlePickPdf}
              disabled={isUploading}
            >
              <Ionicons name="document-outline" size={16} color={Colors.primary.coral} />
              <Text style={styles.uploadBtnText}>PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isUploading && (
          <View style={styles.uploadingRow}>
            <ActivityIndicator size="small" color={Colors.primary.coral} />
            <Text style={styles.uploadingText}>Uploading…</Text>
          </View>
        )}

        <BottomSheetFlatList
          data={documents}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator
                style={styles.loader}
                color={Colors.primary.coral}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="folder-open-outline" size={36} color={Colors.neutral.placeholder} />
                <Text style={styles.emptyText}>No documents yet.</Text>
                <Text style={styles.emptySubText}>Upload an image or PDF above.</Text>
              </View>
            )
          }
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: { backgroundColor: Colors.neutral.border, width: 40 },
  inner: { flex: 1 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.borderLight,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  uploadBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary.coralFaded,
    backgroundColor: Colors.primary.coralFaded,
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary.coral,
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: Colors.status.warningLight,
  },
  uploadingText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  listContent: { padding: 16, gap: 8 },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    padding: 14,
  },
  docIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.neutral.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docMeta: { flex: 1 },
  docName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  docSub: {
    fontSize: 11,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  loader: { marginTop: 40 },
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 6,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginTop: 8,
  },
  emptySubText: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
});
