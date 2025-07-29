import React, { createContext, useContext, useState } from 'react';

const PartyFlowContext = createContext();

export const PartyFlowProvider = ({ children }) => {
  // 'idle', 'partyStarted', 'form', 'quiz', 'completed', 'closed'
  const [partyFlowState, setPartyFlowState] = useState('idle');
  const [partyModeActive, setPartyModeActive] = useState(false);

  // Centralise la fermeture du mode soirée
  const closePartyMode = () => {
    setPartyModeActive(false);
    setPartyFlowState('closed');
  };

  // Ouvre le mode soirée
  const startPartyMode = () => {
    setPartyModeActive(true);
    setPartyFlowState('partyStarted');
  };

  // Ouvre le formulaire
  const openForm = () => {
    setPartyFlowState('form');
  };

  // Ouvre le quiz
  const openQuiz = () => {
    setPartyFlowState('quiz');
  };

  // Termine le quiz
  const completeQuiz = () => {
    if (partyModeActive) {
      closePartyMode();
    } else {
      setPartyFlowState('closed');
    }
  };

  return (
    <PartyFlowContext.Provider value={{
      partyFlowState,
      setPartyFlowState,
      partyModeActive,
      setPartyModeActive,
      startPartyMode,
      closePartyMode,
      openForm,
      openQuiz,
      completeQuiz
    }}>
      {children}
    </PartyFlowContext.Provider>
  );
};

export const usePartyFlow = () => useContext(PartyFlowContext);
