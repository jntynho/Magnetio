import React, { useCallback } from 'react';
import { Studio, Actor, AspectRatio } from '../types';

export const useLinkDetection = (
  actors: Actor[],
  studios: Studio[],
  setSelectedActorIds: React.Dispatch<React.SetStateAction<string[]>>,
  setSelectedStudioIds: React.Dispatch<React.SetStateAction<string[]>>,
  setAspectRatio: React.Dispatch<React.SetStateAction<AspectRatio>>
) => {
  const cleanString = (str: string) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/\.(com|net|org|edu|gov|io|tv|me|info|biz)\b/gi, '') 
      .replace(/[^a-z0-9]/g, ''); 
  };

  const performIntelligentDetection = useCallback((inputText: string, currentStudioIds: string[]) => {
    const target = cleanString(inputText);
    if (!target || target.length < 3) return;

    const codeRegex = /[A-Z0-9]{2,10}-\d{2,10}/i;
    if (codeRegex.test(inputText)) {
      setAspectRatio('3:2');
      const missavStudio = studios.find(t => t.name.toUpperCase() === 'MISSAV' && !t.isDeleted);
      if (missavStudio && currentStudioIds.length === 0) {
        setSelectedStudioIds([missavStudio.id]);
      }
    }

    const newActorIds: string[] = [];
    actors.forEach(actor => {
      if (actor.isDeleted) return;
      const cleanActor = cleanString(actor.name);
      if (cleanActor.length > 2 && target.includes(cleanActor)) {
        newActorIds.push(actor.id);
      }
    });

    const matchingStudios: Studio[] = [];
    studios.forEach(studio => {
      if (studio.isDeleted) return;
      const cleanStudio = cleanString(studio.name);
      if (cleanStudio.length > 1 && target.includes(cleanStudio)) {
        matchingStudios.push(studio);
      }
    });

    const finalStudioIds: string[] = [];
    matchingStudios.forEach(studio => {
      const isShadowed = matchingStudios.some(other => 
        other.id !== studio.id && 
        other.name.toLowerCase().includes(studio.name.toLowerCase()) &&
        other.name.length > studio.name.length
      );
      if (!isShadowed) {
        finalStudioIds.push(studio.id);
      }
    });

    if (newActorIds.length > 0) {
      setSelectedActorIds(prev => Array.from(new Set([...prev, ...newActorIds])));
    }
    
    if (finalStudioIds.length > 0 && currentStudioIds.length === 0) {
      setSelectedStudioIds([finalStudioIds[0]]);
    }
  }, [actors, studios, setSelectedActorIds, setSelectedStudioIds, setAspectRatio]);

  return { performIntelligentDetection };
};
