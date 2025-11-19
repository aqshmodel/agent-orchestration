
import { useState, useRef } from 'react';
import { Artifact } from '../../types';

export const useArtifactState = () => {
  const [artifacts, setArtifacts] = useState<Record<string, Artifact>>({});
  const processedImageTagsRef = useRef<Set<string>>(new Set());

  const registerArtifacts = (newArtifacts: Artifact[]) => {
    if (newArtifacts.length === 0) return;
    setArtifacts(prev => {
      const next = { ...prev };
      newArtifacts.forEach(art => {
        next[art.id] = art;
      });
      return next;
    });
  };

  return { artifacts, setArtifacts, processedImageTagsRef, registerArtifacts };
};
