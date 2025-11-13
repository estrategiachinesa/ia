
const EuroFlag = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="16" fill="#003399"/>
        <g transform="translate(16,16) scale(0.8)">
            <g fill="#FFCC00">
                <path id="star" d="M0-12l3.52 10.82L-9.24 2.36h18.48L3.52 10.82z"/>
                <use href="#star" transform="rotate(36)"/>
                <use href="#star" transform="rotate(72)"/>
                <use href="#star" transform="rotate(108)"/>
                <use href="#star" transform="rotate(144)"/>
                <use href="#star" transform="rotate(180)"/>
                <use href="#star" transform="rotate(216)"/>
                <use href="#star" transform="rotate(252)"/>
                <use href="#star" transform="rotate(288)"/>
                <use href="#star" transform="rotate(324)"/>
                 <use href="#star" transform="rotate(360)"/>
            </g>
        </g>
    </svg>
);


const JapanFlag = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32">
        <rect x="0" y="0" width="32" height="32" fill="#fff" rx="16"/>
        <circle cx="16" cy="16" r="6.4" fill="#bc002d"/>
    </svg>
);


const USFlag = () => (
    <svg width="20" height="20" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <clipPath id="clip_usa">
                <circle cx="16" cy="16" r="16" />
            </clipPath>
        </defs>
        <g clipPath="url(#clip_usa)">
            <rect width="32" height="32" fill="#B22234" />
            <path d="M0,4H32 M0,8H32 M0,12H32 M0,20H32 M0,24H32 M0,28H32" stroke="#FFFFFF" strokeWidth="2.6" />
            <rect width="16" height="18" fill="#3C3B6E" />
            <g fill="#FFFFFF">
                <g transform="translate(2, 2.5)">
                    <g className="stars">
                        <path d="M0,-1.6 l.47,.36 -.18,-.58 .47,.36 -.18,-.58" transform="scale(1.6)"/>
                        <path d="M0,-1.6 l.47,.36 -.18,-.58 .47,.36 -.18,-.58" transform="translate(4,0) scale(1.6)"/>
                        <path d="M0,-1.6 l.47,.36 -.18,-.58 .47,.36 -.18,-.58" transform="translate(8,0) scale(1.6)"/>
                        <path d="M0,-1.6 l.47,.36 -.18,-.58 .47,.36 -.18,-.58" transform="translate(12,0) scale(1.6)"/>
                    </g>
                    <g className="stars" transform="translate(-2, 3)">
                        <path d="M0,-1.6 l.47,.36 -.18,-.58 .47,.36 -.18,-.58" transform="scale(1.6)"/>
                        <path d="M0,-1.6 l.47,.36 -.18,-.58 .47,.36 -.18,-.58" transform="translate(4,0) scale(1.6)"/>
                        <path d="M0,-1.6 l.47,.36 -.18,-.58 .47,.36 -.18,-.58" transform="translate(8,0) scale(1.6)"/>
                         <path d="M0,-1.6 l.47,.36 -.18,-.58 .47,.36 -.18,-.58" transform="translate(12,0) scale(1.6)"/>
                    </g>
                    <g className="stars" transform="translate(0, 6)">
                        <path d="M0,-1.6 l.47,.36 -.18,-.58 .47,.36 -.18,-.58" transform="scale(1.6)"/>
                        <path d="M0,-1.6 l.47,.36 -.18,-.58 .47,.36 -.18,-.58" transform="translate(4,0) scale(1.6)"/>
                        <path d="M0,-1.6 l.47,.36 -.18,-.58 .47,.36 -.18,-.58" transform="translate(8,0) scale(1.6)"/>
                         <path d="M0,-1.6 l.47,.36 -.18,-.58 .47,.36 -.18,-.58" transform="translate(12,0) scale(1.6)"/>
                    </g>
                     <g className="stars" transform="translate(-2, 9)">
                        <path d="M0,-1.6 l.47,.36 -.18,-.58 .47,.36 -.18,-.58" transform="scale(1.6)"/>
                        <path d="M0,-1.6 l.47,.36 -.18,-.58 .47,.36 -.18,-.58" transform="translate(4,0) scale(1.6)"/>
                        <path d="M0,-1.6 l.47,.36 -.18,-.58 .47,.36 -.18,-.58" transform="translate(8,0) scale(1.6)"/>
                         <path d="M0,-1.6 l.47,.36 -.18,-.58 .47,.36 -.18,-.58" transform="translate(12,0) scale(1.6)"/>
                    </g>
                     <g className="stars" transform="translate(0, 12)">
                        <path d="M0,-1.6 l.47,.36 -.18,-.58 .47,.36 -.18,-.58" transform="scale(1.6)"/>
                        <path d="M0,-1.6 l.47,.36 -.18,-.58 .47,.36 -.18,-.58" transform="translate(4,0) scale(1.6)"/>
                        <path d="M0,-1.6 l.47,.36 -.18,-.58 .47,.36 -.18,-.58" transform="translate(8,0) scale(1.6)"/>
                         <path d="M0,-1.6 l.47,.36 -.18,-.58 .47,.36 -.18,-.58" transform="translate(12,0) scale(1.6)"/>
                    </g>
                </g>
            </g>
        </g>
    </svg>
);

type CurrencyFlagsProps = {
    asset: string;
};

export const CurrencyFlags = ({ asset }: CurrencyFlagsProps) => {
    const [currency1, currency2] = asset.replace(' (OTC)', '').split('/');

    const getFlag = (currency: string) => {
        switch (currency) {
            case 'EUR':
                return <EuroFlag />;
            case 'USD':
                return <USFlag />;
            case 'JPY':
                return <JapanFlag />;
            default:
                return null;
        }
    };

    return (
        <div className="flex -space-x-2">
            {getFlag(currency1)}
            {getFlag(currency2)}
        </div>
    );
};

    