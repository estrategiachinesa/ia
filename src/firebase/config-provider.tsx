'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, onSnapshot, collection, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeFirebase } from '.';

// Define the shape of the configuration object
export interface AppConfig {
  hotmartUrl: string;
  exnovaUrl: string;
  iqOptionUrl: string;
  exnovaOpenUrl: string;
  iqOptionOpenUrl: string;
  exnovaPremiumUrl: string;
  iqOptionPremiumUrl: string;
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
  newsWarningDuration: number;
  otcExcellentFrequency: number;
  visitCount?: number;
  checkoutClickCount?: number;
  marketSchedules?: {
      [asset: string]: any;
  };
  // Page access status
  pages?: {
    analisador?: boolean;
    catalogador?: boolean;
    sessaochinesa?: boolean;
    vip?: boolean;
    descubra?: boolean;
    register?: boolean;
    bb?: boolean;
  };
  // Detalhamento por página
  [key: string]: any; 
}

// Define the state for the context
interface ConfigContextState {
  config: AppConfig | null;
  isConfigLoading: boolean;
  configError: Error | null;
  affiliateId: string | null;
  trackCheckoutClick: () => void;
}

// Create the context
const ConfigContext = createContext<ConfigContextState | undefined>(undefined);

// Default configs
const defaultConfig: AppConfig = {
    hotmartUrl: "https://pay.hotmart.com/G102999657C",
    exnovaUrl: "https://exnova.com/lp/start-trading/?aff=198544&aff_model=revenue&afftrack=openbroker",
    iqOptionUrl: "https://affiliate.iqoption.net/redir/?aff=198544&aff_model=revenue&afftrack=openbroker",
    exnovaOpenUrl: "https://exnova.com/lp/start-trading/?aff=198544&aff_model=revenue&afftrack=openbroker",
    iqOptionOpenUrl: "https://affiliate.iqoption.net/redir/?aff=198544&aff_model=revenue&afftrack=openbroker",
    exnovaPremiumUrl: "https://exnova.com/lp/start-trading/?aff=198544&aff_model=revenue&afftrack=iapremium",
    iqOptionPremiumUrl: "https://affiliate.iqoption.net/redir/?aff=198544&aff_model=revenue&afftrack=iapremium",
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
    newsWarningDuration: 60,
    otcExcellentFrequency: 4,
    registrationSecret: "chines_2026",
    price: "R$ 197",
    visitCount: 0,
    checkoutClickCount: 0,
    pages: {
        analisador: true,
        catalogador: true,
        sessaochinesa: true,
        vip: true,
        descubra: true,
        register: true,
        bb: true
    },
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
  const { firestore, auth } = initializeFirebase();
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<Error | null>(null);

  const trackCheckoutClick = useCallback(async () => {
    if (!firestore) return;
    
    const currentUser = auth.currentUser;
    if (currentUser?.email === 'chines@trader.com' || currentUser?.email === 'estrategiachinesa@gmail.com') return;

    const path = window.location.pathname;
    const fieldName = `clicks_${path.replace(/\//g, '') || 'home'}`;
    
    try {
        const analyticsRef = doc(firestore, 'appConfig', 'analytics');
        await updateDoc(analyticsRef, { 
            checkoutClickCount: increment(1),
            [fieldName]: increment(1)
        });
    } catch (e) {
        console.error("Tracking checkout click failed", e);
    }
  }, [firestore, auth]);

  useEffect(() => {
    if (!firestore) return;

    const trackVisit = async () => {
        const path = window.location.pathname;
        if (path.startsWith('/adm')) return; 

        const currentUser = auth.currentUser;
        if (currentUser?.email === 'chines@trader.com' || currentUser?.email === 'estrategiachinesa@gmail.com') return;

        const sessionKey = `visited_${path.replace(/\//g, '_')}`;
        const hasTracked = sessionStorage.getItem(sessionKey);

        if (!hasTracked) {
            try {
                const analyticsRef = doc(firestore, 'appConfig', 'analytics');
                const fieldName = `visits_${path.replace(/\//g, '') || 'home'}`;
                
                const updates: any = { 
                    [fieldName]: increment(1) 
                };

                if (path === '/vip') {
                    updates.visitCount = increment(1);
                }

                const snap = await getDoc(analyticsRef);
                if (!snap.exists()) {
                    await setDoc(analyticsRef, { 
                        visitCount: path === '/vip' ? 1 : 0, 
                        checkoutClickCount: 0,
                        [fieldName]: 1 
                    });
                } else {
                    await updateDoc(analyticsRef, updates);
                }
                sessionStorage.setItem(sessionKey, 'true');
            } catch (e) {
                console.error("Tracking visit failed", e);
            }
        }
    };
    trackVisit();

    const unsubscribers: (() => void)[] = [];
    const docPaths = ['links', 'limitation', 'time', 'remoteValues', 'registration', 'offer', 'analytics', 'pages'];
    
    let loadedDocs = 0;
    const totalDocs = docPaths.length;

    const handleDocUpdate = (docName: string, data: any) => {
        if (docName === 'pages') {
            setConfig(prev => ({ ...prev, pages: { ...defaultConfig.pages, ...data } }));
        } else {
            setConfig(prev => ({ ...prev, ...data }));
        }
        
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
                    if (loadedDocs < totalDocs) {
                        loadedDocs++;
                        if (loadedDocs === totalDocs) setIsConfigLoading(false);
                    }
                }
            },
            (err) => {
                console.error(`Error loading config ${path}:`, err);
                if (loadedDocs < totalDocs) {
                    loadedDocs++;
                    if (loadedDocs === totalDocs) setIsConfigLoading(false);
                }
            }
        );
        unsubscribers.push(unsub);
    });

    const unsubAffiliates = onSnapshot(collection(firestore, 'affiliates'), 
        (snap) => {
            const affiliatesData: { [key: string]: string } = {};
            snap.forEach(doc => {
                affiliatesData[doc.id] = doc.data().checkoutUrl;
            });
            setConfig(prev => ({ ...prev, afiliados: affiliatesData }));
        },
        (err) => {
            console.error("Error loading affiliates:", err);
        }
    );
    unsubscribers.push(unsubAffiliates);

    const timeout = setTimeout(() => {
        if (isConfigLoading) {
            setIsConfigLoading(false);
        }
    }, 5000);

    return () => {
        unsubscribers.forEach(unsub => unsub());
        clearTimeout(timeout);
    };
  }, [firestore, auth]);

  return (
    <ConfigContext.Provider value={{ config, isConfigLoading, configError, affiliateId: affiliateId || null, trackCheckoutClick }}>
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