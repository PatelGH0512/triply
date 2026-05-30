import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDocuments, uploadDocument } from '@/lib/api/documents';

interface UploadDocumentInput {
  uri: string;
  fileName: string;
  mimeType: string;
}

export function useDocuments(tripId: string) {
  return useQuery({
    queryKey: ['documents', tripId],
    queryFn: () => getDocuments(tripId),
    enabled: !!tripId,
  });
}

export function useUploadDocument(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uri, fileName, mimeType }: UploadDocumentInput) =>
      uploadDocument(tripId, uri, fileName, mimeType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', tripId] });
    },
  });
}
