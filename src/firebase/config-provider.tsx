
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
  price: string;
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
    hotmartUrl: "https://pay.hotmart.com/G102999657C",
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

const defaultOfferConfig = {
    price: "R$ 197"
};

const defaultConfig: AppConfig = {
    ...defaultLinkConfig,
    ...defaultLimitConfig,
    ...defaultRemoteValuesConfig,
    ...defaultRegistrationConfig,
    ...defaultOfferConfig,
};

// Create the provider component
export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { firestore } = initializeFirebase();
  const [configState, setConfigState] = useState<ConfigContextState>({
    config: null,
    isConfigLoading: true,
    configError: null,
  });

  useEffect(() => {
    const fetchAndInitializeConfig = async () => {
      if (!firestore) return;
      
      setConfigState(prevState => ({ ...prevState, isConfigLoading: true, configError: null }));

      try {
        const docRefs = {
          links: doc(firestore, 'appConfig', 'links'),
          limitation: doc(firestore, 'appConfig', 'limitation'),
          remoteValues: doc(firestore, 'appConfig', 'remoteValues'),
          registration: doc(firestore, 'appConfig', 'registration'),
          offer: doc(firestore, 'appConfig', 'offer'),
        };

        const [linksSnap, limitationSnap, remoteValuesSnap, registrationSnap, offerSnap] = await Promise.all([
          getDoc(docRefs.links),
          getDoc(docRefs.limitation),
          getDoc(docRefs.remoteValues),
          getDoc(docRefs.registration),
          getDoc(docRefs.offer),
        ]);

        let combinedConfig: AppConfig = { ...defaultConfig };
        let mustInitialize = false;
        
        if (linksSnap.exists()) {
          combinedConfig = { ...combinedConfig, ...linksSnap.data() };
        } else {
          mustInitialize = true;
        }

        if (limitationSnap.exists()) {
          combinedConfig = { ...combinedConfig, ...limitationSnap.data() };
        } else {
          mustInitialize = true;
        }

        if (remoteValuesSnap.exists()) {
          combinedConfig = { ...combinedConfig, ...remoteValuesSnap.data() };
        } else {
          mustInitialize = true;
        }

        if (registrationSnap.exists()) {
          combinedConfig = { ...combinedConfig, ...registrationSnap.data() };
        } else {
          mustInitialize = true;
        }

        if (offerSnap.exists()) {
          combinedConfig = { ...combinedConfig, ...offerSnap.data() };
        } else {
          mustInitialize = true;
        }
        
        setConfigState({ config: combinedConfig, isConfigLoading: false, configError: null });

        if (mustInitialize) {
          console.log("One or more config documents missing, initializing...");
          const batch = writeBatch(firestore);
          if (!linksSnap.exists()) batch.set(docRefs.links, defaultLinkConfig);
          if (!limitationSnap.exists()) batch.set(docRefs.limitation, defaultLimitConfig);
          if (!remoteValuesSnap.exists()) batch.set(docRefs.remoteValues, defaultRemoteValuesConfig);
          if (!registrationSnap.exists()) batch.set(docRefs.registration, defaultRegistrationConfig);
          if (!offerSnap.exists()) batch.set(docRefs.offer, defaultOfferConfig);
          await batch.commit();
          console.log("Default configs initialized.");
        }

      } catch (error) {
        console.error("Error fetching remote config:", error);
        setConfigState({
          config: defaultConfig, // Fallback to default on error
          isConfigLoading: false,
          configError: error instanceof Error ? error : new Error('An unknown error occurred'),
        });
      }
    };

    fetchAndInitializeConfig();

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
