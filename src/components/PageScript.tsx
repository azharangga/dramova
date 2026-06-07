import Script from "next/script";

type PageScriptProps = {
  id: string;
  src: string;
};

export default function PageScript({ id, src }: PageScriptProps) {
  return (
    <Script
      id={id}
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
        function _load(){var s=document.createElement('script');s.src='${src}';document.body.appendChild(s);}
        if(window.__DRAMOVA_READY)_load();else document.addEventListener('dramova:ready',_load,{once:true});
      `,
      }}
    />
  );
}
