
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, onSnapshot, collection } from 'firebase/firestore';
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
  invertSignal: boolean;
  registrationSecret: string;
  price: string;
  afiliados: { [key: string]: string };
  vipMinWait: number;
  vipMaxWait: number;
  premiumMinWait: number;
  premiumMaxWait: number;
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

// Default configs to be used as a fallback
const defaultConfig: AppConfig = {
    hotmartUrl: "https://pay.hotmart.com/G102999657C",
    exnovaUrl: "https://exnova.com/lp/start-trading/?aff=198544&aff_model=revenue&afftrack=",
    iqOptionUrl: "https://affiliate.iqoption.net/redir/?aff=198544&aff_model=revenue&afftrack=",
    telegramUrl: "https://t.me/Trader_Chines",
    blackFridayUrl: "https://pay.hotmart.com/E101943327K?checkoutMode=2&off=cy5v5mrr",
    vipUrl: "https://pay.hotmart.com/T101931662P?checkoutMode=2",
    hourlySignalLimit: 3,
    correlationChance: 0.7,
    invertSignal: false,
    vipMinWait: 5,
    vipMaxWait: 15,
    premiumMinWait: 1,
    premiumMaxWait: 10,
    registrationSecret: "chines_2026",
    price: "R$ 197",
    afiliados: {
      "wm": "https://go.hotmart.com/D103007301M?dp=1"
    },
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

export const ConfigProvider: React.FC<{ children: ReactNode, affiliateId?: string | null }> = ({ children, affiliateId }) => {
  const { firestore } = initializeFirebase();
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore) return;

    const unsubscribers: (() => void)[] = [];

    // Real-time listener for appConfig documents
    const docPaths = ['links', 'limitation', 'time', 'remoteValues', 'registration', 'offer'];
    
    let loadedDocs = 0;
    const totalDocs = docPaths.length;

    const handleDocUpdate = (docName: string, data: any) => {
        setConfig(prev => ({ ...prev, ...data }));
        if (loadedDocs < totalDocs) {
            loadedDocs++;
            if (loadedDocs === totalDocs) setIsConfigLoading(false);
        }
    };

    docPaths.forEach(path => {
        const unsub = onSnapshot(doc(firestore, 'appConfig', path), 
            (snap) => {
                if (snap.exists()) {
                    handleDocUpdate(path, snap.data());
                } else {
                    // Even if doc doesn't exist, count it as "loaded" to clear loader
                    if (loadedDocs < totalDocs) {
                        loadedDocs++;
                        if (loadedDocs === totalDocs) setIsConfigLoading(false);
                    }
                }
            },
            (err) => {
                console.error(`Error loading config ${path}:`, err);
                setConfigError(err);
            }
        );
        unsubscribers.push(unsub);
    });

    // Real-time listener for affiliates
    const unsubAffiliates = onSnapshot(collection(firestore, 'affiliates'), 
        (snap) => {
            const affiliatesData: { [key: string]: string } = {};
            snap.forEach(doc => {
                affiliatesData[doc.id] = doc.data().checkoutUrl;
            });
            setConfig(prev => ({ ...prev, afiliados: affiliatesData }));
        }
    );
    unsubscribers.push(unsubAffiliates);

    // Timeout fallback if Firestore is unresponsive
    const timeout = setTimeout(() => {
        if (isConfigLoading) {
            setIsConfigLoading(false);
        }
    }, 5000);

    return () => {
        unsubscribers.forEach(unsub => unsub());
        clearTimeout(timeout);
    };
  }, [firestore]);

  return (
    <ConfigContext.Provider value={{ config, isConfigLoading, configError, affiliateId: affiliateId || null }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const AppConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [affiliateId, setAffiliateId] = useState<string | null>(null);

    return (
        <Suspense fallback={null}>
            <AffiliateIdManager setAffiliateId={setAffiliateId}>
                <ConfigProvider affiliateId={affiliateId}>
                    {children}
                </ConfigProvider>
            </AffiliateIdManager>
        </Suspense>
    );
};

export const useAppConfig = (): ConfigContextState => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useAppConfig must be used within a AppConfigProvider');
  }
  return context;
};
