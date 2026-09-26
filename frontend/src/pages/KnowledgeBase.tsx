import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { KnowledgeStats } from '../components/knowledge/KnowledgeStats';
import { KnowledgeUpload } from '../components/knowledge/KnowledgeUpload';
import { DocumentTable } from '../components/knowledge/DocumentTable';
import { useKnowledge } from '../hooks/useKnowledge';

export const KnowledgeBase: React.FC = () => {
  const { documents, loading, uploadDocument, deleteDocument } = useKnowledge();

  const totalChunks = documents.reduce((sum, d) => sum + d.chunks_count, 0);

  return (
    <PageContainer title="Approved Enterprise Knowledge Base">
      <KnowledgeStats totalDocs={documents.length} totalChunks={totalChunks} />
      <KnowledgeUpload onUpload={uploadDocument} loading={loading} />
      <DocumentTable documents={documents} onDelete={deleteDocument} />
    </PageContainer>
  );
};
