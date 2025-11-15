
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { useFirestore } from './provider';
import { initializeFirebase } from '.';

// Define the shape of the configuration object
export interface AppConfig {
  hotmartUrl: string;
  exnovaUrl: string;
  iqOptionUrl: string;
  telegramUrl: string;
  hourlySignalLimit: number;
  correlationChance: number;
  registrationSecret: string;
}

// Define the state for the config context
interface ConfigContextState {
  config: AppConfig | null;
  isConfigLoading: boolean;
  configError: Error | null;
}

// Create the context with an initial undefined value
const ConfigContext = createContext<ConfigContextState | undefined>(undefined);

// Default configs to be used as a fallback and for initial creation
const defaultLinkConfig = {
    hotmartUrl: "https://pay.hotmart.com/E101943327K",
    exnovaUrl: "https://exnova.com/lp/start-trading/?aff=198544&aff_model=revenue&afftrack=",
    iqOptionUrl: "https://affiliate.iqoption.net/redir/?aff=198544&aff_model=revenue&afftrack=",
    telegramUrl: "https://t.me/Trader_Chines",
};

const defaultLimitConfig = {
    hourlySignalLimit: 3
};

// New remote config for correlation
const defaultRemoteValuesConfig = {
    correlationChance: 0.7
};

const defaultRegistrationConfig = {
    registrationSecret: "changeme"
};


const defaultConfig: AppConfig = {
    ...defaultLinkConfig,
    ...defaultLimitConfig,
    ...defaultRemoteValuesConfig,
    ...defaultRegistrationConfig
};

// Create the provider component
export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const firestore = useFirestore();

  const [configState, setConfigState] = useState<ConfigContextState>({
    config: null,
    isConfigLoading: true,
    configError: null,
  });

  useEffect(() => {
    if (!firestore) {
      // This case might happen during server-side rendering or if Firebase initialization fails.
      // We provide the hardcoded defaults.
      setConfigState({
        config: defaultConfig,
        isConfigLoading: false,
        configError: new Error("Firestore is not available."),
      });
      return;
    }

    const fetchConfig = async () => {
      const linksRef = doc(firestore, 'appConfig', 'links');
      const limitationRef = doc(firestore, 'appConfig', 'limitation');
      const remoteValuesRef = doc(firestore, 'appConfig', 'remoteValues');
      const registrationRef = doc(firestore, 'appConfig', 'registration');


      try {
        const [linksSnap, limitationSnap, remoteValuesSnap, registrationSnap] = await Promise.all([
            getDoc(linksRef),
            getDoc(limitationRef),
            getDoc(remoteValuesRef),
            getDoc(registrationRef),
        ]);
        
        let mergedConfig = {...defaultConfig};
        const batch = writeBatch(firestore);
        let needsWrite = false;

        // Process Links
        if (linksSnap.exists()) {
          mergedConfig = { ...mergedConfig, ...linksSnap.data() };
        } else {
          console.warn("Links config document not found. Creating it with defaults.");
          batch.set(linksRef, defaultLinkConfig);
          needsWrite = true;
        }

        // Process Limitation
        if (limitationSnap.exists()) {
          mergedConfig = { ...mergedConfig, ...limitationSnap.data() };
        } else {
          console.warn("Limitation config document not found. Creating it with defaults.");
          batch.set(limitationRef, defaultLimitConfig);
          needsWrite = true;
        }
        
        // Process Remote Values
        if (remoteValuesSnap.exists()) {
            mergedConfig = { ...mergedConfig, ...remoteValuesSnap.data() };
        } else {
            console.warn("Remote values config document not found. Creating it with defaults.");
            batch.set(remoteValuesRef, defaultRemoteValuesConfig);
needsWrite = true;
        }

        // Process Registration Secret
        if (registrationSnap.exists()) {
            mergedConfig = { ...mergedConfig, secretKey: registrationSnap.data().secretKey };
        } else {
            console.warn("Registration config document not found. Creating it with defaults.");
            batch.set(registrationRef, defaultRegistrationConfig);
            needsWrite = true;
        }

        if (needsWrite) {
          await batch.commit();
        }

        setConfigState({
          config: mergedConfig,
          isConfigLoading: false,
          configError: null,
        });

      } catch (error) {
        console.error("Error fetching or creating remote config, using defaults:", error);
        setConfigState({
          config: defaultConfig,
          isConfigLoading: false,
          configError: error instanceof Error ? error : new Error('Failed to fetch config'),
        });
      }
    };

    fetchConfig();
  }, [firestore]);

  return (
    <ConfigContext.Provider value={configState}>
      {children}
    </ConfigContext.Provider>
  );
};

// Create the hook to use the config context
export const useAppConfig = (): ConfigContextState => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useAppConfig must be used within a ConfigProvider');
  }
  return context;
};
