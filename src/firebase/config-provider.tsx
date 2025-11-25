'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, getDoc, writeBatch, collection, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '.';

// Define the shape of the configuration object
export interface AppConfig {
  hotmartUrl: string;
  exnovaUrl: string;
  iqOptionUrl: string;
  telegramUrl: string;
  blackFridayUrl: string;
  vipUrl?: string;
  hourlySignalLimit: number;
  correlationChance: number;
  registrationSecret: string;
  price: string;
  afiliados: { [key: string]: string };
}

// Define the state for the config context
interface ConfigContextState {
  config: AppConfig | null;
  isConfigLoading: boolean;
  configError: Error | null;
  affiliateId: string | null;
}

// Create the context with an initial undefined value
const ConfigContext = createContext<ConfigContextState | undefined>(undefined);

// Default configs to be used as a fallback and for initial creation
const defaultLinkConfig = {
    hotmartUrl: "https://go.hotmart.com/E102992922I?dp=1",
    exnovaUrl: "https://exnova.com/lp/start-trading/?aff=198544&aff_model=revenue&afftrack=",
    iqOptionUrl: "https://affiliate.iqoption.net/redir/?aff=198544&aff_model=revenue&afftrack=",
    telegramUrl: "https://t.me/Trader_Chines",
    blackFridayUrl: "https://pay.hotmart.com/E101943327K?checkoutMode=2&off=cy5v5mrr",
    vipUrl: "https://pay.hotmart.com/T101931662P?checkoutMode=2"
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


// This is the fallback config used if Firestore is unreachable.
const defaultConfig: AppConfig = {
    ...defaultLinkConfig,
    ...defaultLimitConfig,
    ...defaultRemoteValuesConfig,
    ...defaultOfferConfig,
    afiliados: {}, // Default afiliados is an empty object
    registrationSecret: 'changeme',
};

const AffiliateIdManager: React.FC<{
  setAffiliateId: React.Dispatch<React.SetStateAction<string | null>>;
  children: ReactNode;
}> = ({ setAffiliateId, children }) => {
  const searchParams = useSearchParams();

  useEffect(() => {
    const affIdFromUrl = searchParams.get('aff');
    const affIdFromStorage = localStorage.getItem('affiliateId');

    if (affIdFromUrl) {
      if (affIdFromUrl !== affIdFromStorage) {
        localStorage.setItem('affiliateId', affIdFromUrl);
      }
      setAffiliateId(affIdFromUrl);
    } else if (affIdFromStorage) {
      setAffiliateId(affIdFromStorage);
    } else {
      setAffiliateId(null);
    }
  }, [searchParams, setAffiliateId]);

  return <>{children}</>;
};

// Create the provider component
export const ConfigProvider: React.FC<{ children: ReactNode, affiliateId?: string | null }> = ({ children, affiliateId }) => {
  const { firestore } = initializeFirebase();
  const [configState, setConfigState] = useState<Omit<ConfigContextState, 'affiliateId'>>({
    config: null,
    isConfigLoading: true,
    configError: null,
  });

  useEffect(() => {
    const fetchAndInitializeConfig = async () => {
      if (!firestore) return;
      
      setConfigState(prevState => ({ ...prevState, isConfigLoading: true, configError: null }));

      try {
        // Fetch all affiliates first
        const affiliatesCollectionRef = collection(firestore, 'affiliates');
        const affiliatesSnapshot = await getDocs(affiliatesCollectionRef);
        const affiliatesData: { [key: string]: string } = {};
        affiliatesSnapshot.forEach(doc => {
            affiliatesData[doc.id] = doc.data().checkoutUrl;
        });


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

        let combinedConfig: AppConfig = { ...defaultConfig, afiliados: affiliatesData };
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
    <ConfigContext.Provider value={{ ...configState, affiliateId: affiliateId !== undefined ? affiliateId : null }}>
      {children}
    </ConfigContext.Provider>
  );
};

// Main provider to be used in the layout.
export const AppConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [affiliateId, setAffiliateId] = useState<string | null>(null);

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AffiliateIdManager setAffiliateId={setAffiliateId}>
                <ConfigProvider affiliateId={affiliateId}>
                    {children}
                </ConfigProvider>
            </AffiliateIdManager>
        </Suspense>
    );
};


// Create the hook to use the config context
export const useAppConfig = (): ConfigContextState => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useAppConfig must be used within a AppConfigProvider');
  }
  return context;
};
