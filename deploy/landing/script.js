/* =============================================================================
   RADOX Landing Page — Interactivity
   Particle animation, scroll reveal, navbar, form, language toggle
   ============================================================================= */

(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* TRANSLATIONS                                                        */
  /* ------------------------------------------------------------------ */
  const TR = {
    en: {
      nav: { howItWorks: 'How It Works', forCompanies: 'For Companies', forInvestors: 'For Investors', security: 'Security', cta: 'Book a Call', ceo: 'Contact the CEO', app: '→ Open App' },
      hero: {
        tag: 'Tokenized Private Credit',
        headline: 'Private credit.\nDollar returns.\n<em class="hero-h1-accent">made easy.</em>',
        sub: 'From your first investment to earnings \u2014 in 5 minutes, no bureaucracy.',
        startLabel: 'start here',
        cta: 'Open App',
        cta1: 'Schedule a Meeting',
        cta2: 'Join the Waitlist'
      },
      metrics: {
        m1v: 'R$6T', m1l: 'Brazilian private credit market',
        m2v: '<1%', m2l: 'Tokenization penetration',
        m3v: 'USD',  m3l: 'Returns credited to your wallet',
        m4v: '5 min', m4l: 'To start investing'
      },
      trust: { label: 'Infrastructure' },
      howItWorks: { title: 'How It Works', steps: [
        { num: '01', title: 'Choose a Credit Asset', desc: 'Browse curated fixed-income instruments — CRI, CRA, CCB, debentures, FIDC and more. Real estate, agro, and corporate.' },
        { num: '02', title: 'Invest from R$500', desc: 'No overseas bank account. No bureaucracy. Done in 5 minutes.' },
        { num: '03', title: 'Earn in Dollars', desc: 'Returns credited to your wallet in USDC. Track your portfolio in real time.' }
      ]},
      forInvestors: { title: 'Why Invest in Radox', cards: [
        { title: 'R$6T Market, <1% Tokenized', desc: 'Brazil\'s private credit market is one of the largest in Latin America. Tokenization penetration is under 1% — we are at the very start of the curve.' },
        { title: 'Auditable, Recurring Revenue', desc: 'Issuance, trading, and custody fees — all on-chain. Visible, predictable, compounding.' },
        { title: 'Compliance-First Since Day One', desc: 'KYC, AML, and securities law baked into the architecture. Zero regulatory retrofitting.' },
        { title: 'Stellar/Soroban Infrastructure', desc: 'Auditable smart contracts, atomic settlement, non-custodial wallets. No dependency on centralized custodians.' }
      ], cta: 'Talk to Our Team' },
      forCompanies: { title: 'Raise Capital. Tokenize Your Credit Operations.', cards: [
        { title: 'Any Credit Structure', desc: 'CRIs, CRAs, CCBs, debentures, FIDCs — any fixed-income instrument can be tokenized and distributed on-chain.' },
        { title: 'Real Estate as Collateral', desc: 'Use property as collateral to back credit operations. The asset stays yours; capital flows to you.' },
        { title: 'Compliance Built In', desc: 'KYC, AML, and multi-signature controls already included. Structured for CVM and Bacen frameworks.' }
      ], cta: 'Schedule a Conversation' },
      useCases: { title: 'What Can Be Tokenized', cards: [
        { title: 'CRI / CRA', desc: 'Real estate and agro credit certificates — fixed income with on-chain programmable yields.' },
        { title: 'CCB', desc: 'Bank credit bills backed by real estate or other collateral, distributed to accredited investors.' },
        { title: 'Debentures', desc: 'Corporate debt instruments tokenized for transparent, programmable issuance and settlement.' },
        { title: 'FIDC', desc: 'Receivables investment funds fractioned into security tokens — liquid and auditable.' },
        { title: 'Agro Credit (CRA / CPR)', desc: 'Agricultural credit backed by land and harvest rights, with dollar-denominated returns.' },
        { title: 'Precatórios', desc: 'Government judicial debt obligations tokenized for liquidity and fractional trading.' },
        { title: 'LC (Letra de Câmbio)', desc: 'Exchange bills issued by finance companies, tokenized for broader distribution.' },
        { title: 'Real Estate (Collateral)', desc: 'Residential and commercial property as collateral backing credit operations — not the primary product.' }
      ]},
      security: { title: 'How We Protect Your Investments', items: [
        { title: 'Multi-Signature Approvals', desc: 'Every critical operation requires multiple approvals. Nothing moves unilaterally.' },
        { title: 'Full KYC / AML', desc: 'Complete identity verification for every participant on the platform.' },
        { title: 'Everything on Stellar', desc: 'All transactions verifiable on the Stellar blockchain. Open, permanent, auditable.' },
        { title: 'Passkey Wallets', desc: 'No seed phrases. No complexity. Your wallet is tied to your biometrics.' }
      ]},
      whitelist: { title: 'Join the Waitlist', sub: 'Be among the first to access the platform.', name: 'Name', role: 'My profile is...', roleOptions: ['Individual Investor', 'Issuing Company', 'Partner / VC', 'Other'], submit: 'Join the Waitlist', success: "You're on the waitlist! We'll be in touch soon." },
      footer: { tagline: 'Tokenized private credit — on Stellar', platform: 'Platform', legal: 'Legal', connect: 'Contact', terms: 'Terms of Service', privacy: 'Privacy Policy', risk: 'Risk Disclaimer', disclaimer: 'Radox is not a broker-dealer or investment advisor. Securities offered through the platform are subject to applicable regulatory requirements. Past performance does not guarantee future results.' }
    },
    pt: {
      nav: { howItWorks: 'Como Funciona', forCompanies: 'Para Empresas', forInvestors: 'Para Investidores', security: 'Segurança', cta: 'Agendar Reunião', ceo: 'Falar com o CEO', app: '→ Abrir App' },
      hero: {
        tag: 'Crédito Privado Tokenizado',
        headline: 'Crédito privado.\nRetorno em dólar digital.\n<em class="hero-h1-accent">made easy.</em>',
        sub: 'Do primeiro investimento ao rendimento \u2014 em 5 minutos, sem burocracia.',
        startLabel: 'comece aqui',
        cta: 'Abrir App',
        cta1: 'Agendar Reunião',
        cta2: 'Entrar na Lista'
      },
      metrics: {
        m1v: 'R$6T', m1l: 'Mercado de crédito privado no Brasil',
        m2v: '<1%', m2l: 'Penetração da tokenização',
        m3v: 'USD',  m3l: 'Rendimento na sua carteira',
        m4v: '5 min', m4l: 'Para começar a investir'
      },
      trust: { label: 'Infraestrutura' },
      howItWorks: { title: 'Como Funciona', steps: [
        { num: '01', title: 'Escolha um Ativo de Crédito', desc: 'Navegue por instrumentos de renda fixa selecionados — CRI, CRA, CCB, debêntures, FIDC e mais. Imobiliário, agro e corporativo.' },
        { num: '02', title: 'Invista a partir de R$500', desc: 'Sem conta no exterior. Sem burocracia. Em 5 minutos.' },
        { num: '03', title: 'Receba em Dólar', desc: 'Rendimento creditado na sua carteira em USDC. Acompanhe em tempo real.' }
      ]},
      forInvestors: { title: 'Por Que Investir na Radox', cards: [
        { title: 'R$6T de Mercado, <1% Tokenizado', desc: 'O mercado de crédito privado no Brasil é um dos maiores da América Latina. A tokenização está abaixo de 1% — estamos no começo da curva.' },
        { title: 'Receita Recorrente e Auditável', desc: 'Taxas de emissão, negociação e custódia — tudo on-chain. Visíveis, previsíveis, compostas.' },
        { title: 'Compliance Desde o Primeiro Commit', desc: 'KYC, AML e estrutura de valores mobiliários na arquitetura. Zero retrofitting regulatório.' },
        { title: 'Infraestrutura Stellar/Soroban', desc: 'Contratos inteligentes auditáveis, liquidação atômica, custódia não-custodial. Sem dependência de custodians centralizados.' }
      ], cta: 'Falar com o Time' },
      forCompanies: { title: 'Capte Capital. Tokenize Suas Operações de Crédito.', cards: [
        { title: 'Qualquer Estrutura de Crédito', desc: 'CRIs, CRAs, CCBs, debêntures, FIDCs — qualquer instrumento de renda fixa pode ser tokenizado e distribuído on-chain.' },
        { title: 'Imóvel como Colateral', desc: 'Use o imóvel como garantia para lastrear operações de crédito. O ativo continua seu; o capital flui para você.' },
        { title: 'Compliance Integrado', desc: 'KYC, AML e controle multi-assinatura já incluídos. Estruturado para os frameworks da CVM e do Bacen.' }
      ], cta: 'Agendar uma Conversa' },
      useCases: { title: 'O Que Pode Ser Tokenizado', cards: [
        { title: 'CRI / CRA', desc: 'Certificados de recebíveis imobiliários e do agronegócio — renda fixa com rendimentos programáveis on-chain.' },
        { title: 'CCB', desc: 'Cédulas de crédito bancário com lastro imobiliário ou outros colaterais, distribuídas para investidores qualificados.' },
        { title: 'Debêntures', desc: 'Instrumentos de dívida corporativa tokenizados para emissão e liquidação transparentes e programáveis.' },
        { title: 'FIDC', desc: 'Fundos de investimento em direitos creditórios fracionados em tokens de segurança — líquidos e auditáveis.' },
        { title: 'Crédito Agro (CRA / CPR)', desc: 'Crédito rural com lastro em terra e direitos de safra, com rendimento em dólar.' },
        { title: 'Precatórios', desc: 'Obrigações judiciais do governo tokenizadas para liquidez e negociação fracionada.' },
        { title: 'LC (Letra de Câmbio)', desc: 'Letras de câmbio emitidas por financeiras, tokenizadas para distribuição ampliada.' },
        { title: 'Imóvel (Colateral)', desc: 'Propriedade residencial e comercial como garantia de operações de crédito — não o produto principal.' }
      ]},
      security: { title: 'Como Protegemos Seus Investimentos', items: [
        { title: 'Aprovação Múltipla', desc: 'Toda operação crítica requer múltiplas aprovações. Nada se move unilateralmente.' },
        { title: 'KYC / AML Completo', desc: 'Verificação completa de identidade para todos os participantes da plataforma.' },
        { title: 'Tudo na Stellar', desc: 'Todas as transações verificáveis na blockchain Stellar. Aberta, permanente, auditável.' },
        { title: 'Carteiras com Passkey', desc: 'Sem seed phrase. Sem complexidade. Sua carteira é vinculada à sua biometria.' }
      ]},
      whitelist: { title: 'Entrar na Lista de Espera', sub: 'Seja um dos primeiros a acessar a plataforma.', name: 'Nome', role: 'Meu perfil é...', roleOptions: ['Investidor Pessoa Física', 'Empresa Emissora', 'Parceiro / VC', 'Outro'], submit: 'Entrar na Lista de Espera', success: 'Você está na lista! Entraremos em contato em breve.' },
      footer: { tagline: 'Crédito privado tokenizado — na Stellar', platform: 'Plataforma', legal: 'Legal', connect: 'Contato', terms: 'Termos de Serviço', privacy: 'Política de Privacidade', risk: 'Aviso de Risco', disclaimer: 'Radox não é corretora de valores nem consultora de investimentos. Os valores mobiliários oferecidos através da plataforma estão sujeitos aos requisitos regulatórios aplicáveis. Rentabilidade passada não garante resultados futuros.' }
    }
  };

  let currentLang = 'en';

  /* ------------------------------------------------------------------ */
  /* LANGUAGE TOGGLE                                                     */
  /* ------------------------------------------------------------------ */
  function setLang(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;

    // Update all translatable elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = key.split('.').reduce((o, k) => o && o[k], TR[lang]);
      if (val != null) {
        if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
          // skip — placeholders stay
        } else if (typeof val === 'string' && val.includes('<')) {
          el.innerHTML = val.replace(/\\n/g, '<br>');
        } else {
          el.textContent = val;
        }
      }
    });

    // Update lang toggle button
    const btn = document.getElementById('lang-btn');
    if (btn) btn.textContent = lang === 'en' ? 'EN | PT' : 'PT | EN';

    // Rebuild dynamic sections
    buildHowItWorks();
    buildForCompanies();
    buildForInvestors();
    buildUseCases();
    buildSecurity();


    buildMetrics();
    buildWaitlistLabels();
    buildFooter();
  }

  function toggleLang() {
    setLang(currentLang === 'en' ? 'pt' : 'en');
  }

  /* ------------------------------------------------------------------ */
  /* SVG ICONS (inline Lucide-style)                                     */
  /* ------------------------------------------------------------------ */
  const ICONS = {
    compass: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
    briefcase: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
    trendingUp: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
    layers: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    eye: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    percent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
    key: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>',
    coins: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>',
    globe: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
    shieldCheck: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
    dollarSign: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    cpu: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>',
    userCheck: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>',
    smartphone: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>',
    building: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
    fileText: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
    banknote: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>',
    landmark: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>',
    barChart: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M13 17V9"/><path d="M18 17V5"/><path d="M8 17v-3"/></svg>',
    gem: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>',
    leaf: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
    palette: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',
    lightbulb: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
    hardHat: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M4 15v-3a6 6 0 0 1 6-6h0"/><path d="M14 6h0a6 6 0 0 1 6 6v3"/></svg>',
    shield: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
    package: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
    trophy: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
    diamond: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z"/></svg>',
    menu: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>',
    x: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'
  };

  /* Use-case icon mapping — 8 credit instruments */
  const USE_ICONS = [
    'fileText', 'banknote', 'barChart', 'layers', 'leaf', 'landmark', 'coins', 'building'
  ];

  /* ------------------------------------------------------------------ */
  /* DYNAMIC SECTION BUILDERS                                            */
  /* ------------------------------------------------------------------ */

  function buildHowItWorks() {
    const g = document.getElementById('steps-grid');
    if (!g) return;
    const tr = TR[currentLang];
    const stepIcons = ['compass', 'briefcase', 'trendingUp'];
    g.innerHTML = tr.howItWorks.steps.map((s, i) => `
      <div class="step reveal reveal-delay-${i + 1}">
        <div class="step-icon">${ICONS[stepIcons[i]]}</div>
        <p class="step-num">${s.num}</p>
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
      </div>
    `).join('');
    observeReveals(g);
  }

  function buildForUsers() {
    const g = document.getElementById('user-grid');
    if (!g) return;
    const tr = TR[currentLang];
    const cardIcons = ['layers', 'eye', 'percent', 'key'];
    g.innerHTML = tr.forUsers.cards.map((c, i) => `
      <div class="user-card glass-card hover-lift reveal reveal-delay-${i + 1}">
        ${ICONS[cardIcons[i]]}
        <h3>${c.title}</h3>
        <p>${c.desc}</p>
      </div>
    `).join('');
    observeReveals(g);
  }

  function buildForCompanies() {
    const g = document.getElementById('company-grid');
    if (!g) return;
    const tr = TR[currentLang];
    const cardIcons = ['coins', 'globe', 'shieldCheck'];
    g.innerHTML = tr.forCompanies.cards.map((c, i) => `
      <div class="company-card light-card hover-lift reveal reveal-delay-${i + 1}">
        ${ICONS[cardIcons[i]]}
        <h3>${c.title}</h3>
        <p>${c.desc}</p>
      </div>
    `).join('');
    observeReveals(g);
  }

  function buildForInvestors() {
    const g = document.getElementById('investor-grid');
    if (!g) return;
    const tr = TR[currentLang];
    const cardIcons = ['trendingUp', 'dollarSign', 'shieldCheck', 'cpu'];
    g.innerHTML = tr.forInvestors.cards.map((c, i) => `
      <div class="investor-card glass-card hover-lift reveal reveal-delay-${i + 1}">
        ${ICONS[cardIcons[i]]}
        <h3>${c.title}</h3>
        <p>${c.desc}</p>
      </div>
    `).join('');
    observeReveals(g);
  }

  function buildUseCases() {
    const g = document.getElementById('use-grid');
    if (!g) return;
    const tr = TR[currentLang];
    g.innerHTML = tr.useCases.cards.map((c, i) => `
      <div class="use-card glass-card hover-lift reveal" style="transition-delay:${i * 50}ms">
        ${ICONS[USE_ICONS[i]] || ICONS.gem}
        <h3>${c.title}</h3>
        <p>${c.desc}</p>
      </div>
    `).join('');
    observeReveals(g);
  }

  function buildSecurity() {
    const g = document.getElementById('security-grid');
    if (!g) return;
    const tr = TR[currentLang];
    const cardIcons = ['shieldCheck', 'userCheck', 'eye', 'smartphone'];
    g.innerHTML = tr.security.items.map((item, i) => `
      <div class="security-card light-card hover-lift reveal reveal-delay-${i + 1}">
        <div class="security-icon">${ICONS[cardIcons[i]]}</div>
        <div>
          <h3>${item.title}</h3>
          <p>${item.desc}</p>
        </div>
      </div>
    `).join('');
    observeReveals(g);
  }




  function buildMetrics() {
    const tr = TR[currentLang];
    if (!tr.metrics) return;
    const fields = ['m1v','m2v','m3v','m4v','m1l','m2l','m3l','m4l'];
    fields.forEach(k => {
      const el = document.querySelector(`[data-i18n="metrics.${k}"]`);
      if (el) el.textContent = tr.metrics[k];
    });
    const heroTag = document.querySelector('[data-i18n="hero.tag"]');
    if (heroTag) heroTag.textContent = tr.hero.tag;
  }

  function buildWaitlistLabels() {
    const tr = TR[currentLang];
    const els = {
      'wl-title': tr.whitelist.title,
      'wl-sub': tr.whitelist.sub,
      'wl-name-label': tr.whitelist.name,
      'wl-role-label': tr.whitelist.role,
      'wl-submit': tr.whitelist.submit
    };
    Object.entries(els).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
    // Role options
    const sel = document.getElementById('wl-role');
    if (sel) {
      const current = sel.value;
      sel.innerHTML = '<option value="">—</option>' + tr.whitelist.roleOptions.map(o => `<option value="${o}">${o}</option>`).join('');
      sel.value = current;
    }
  }

  function buildFooter() {
    const tr = TR[currentLang];
    const els = {
      'ft-tagline': tr.footer.tagline,
      'ft-platform': tr.footer.platform,
      'ft-legal': tr.footer.legal,
      'ft-connect': tr.footer.connect,
      'ft-terms': tr.footer.terms,
      'ft-privacy': tr.footer.privacy,
      'ft-risk': tr.footer.risk,
      'ft-disclaimer': tr.footer.disclaimer,
      'ft-how': tr.nav.howItWorks,
      'ft-investors': tr.nav.forInvestors,
      'ft-companies': tr.nav.forCompanies
    };
    Object.entries(els).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
  }

  /* ------------------------------------------------------------------ */
  /* SCROLL REVEAL (IntersectionObserver)                                */
  /* ------------------------------------------------------------------ */
  function observeReveals(root) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    (root || document).querySelectorAll('.reveal:not(.visible)').forEach(el => obs.observe(el));
  }

  /* ------------------------------------------------------------------ */
  /* NAVBAR SCROLL                                                       */
  /* ------------------------------------------------------------------ */
  function initNavbar() {
    const nav = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    let menuOpen = false;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 80) nav.classList.add('scrolled', 'navbar-glass');
      else nav.classList.remove('scrolled', 'navbar-glass');
    }, { passive: true });

    hamburger.addEventListener('click', () => {
      menuOpen = !menuOpen;
      mobileMenu.classList.toggle('open', menuOpen);
      hamburger.innerHTML = menuOpen ? ICONS.x : ICONS.menu;
    });

    // Smooth scroll for all nav links
    document.querySelectorAll('[data-scroll]').forEach(btn => {
      btn.addEventListener('click', () => {
        menuOpen = false;
        mobileMenu.classList.remove('open');
        hamburger.innerHTML = ICONS.menu;
        const target = document.getElementById(btn.getAttribute('data-scroll'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Logo scroll to top
    document.getElementById('logo-btn').addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ------------------------------------------------------------------ */
  /* WAITLIST FORM                                                       */
  /* ------------------------------------------------------------------ */
  function initForm() {
    const form = document.getElementById('waitlist-form');
    if (!form) return;
    const loadedAt = Date.now();

    // ── Google Sheets webhook (replace URL after Apps Script deploy) ──
    const SHEETS_WEBHOOK = 'https://script.google.com/macros/s/AKfycbzk9S9f4cu-1XwaTz7-YD30BT8V2pPlMAaq28kd1DheLP04eZ2d1unMpaNpIimCDSh4Dg/exec';

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // Bot protection
      if (form.querySelector('[name="website"]').value) return;
      if (Date.now() - loadedAt < 3000) return;

      const name = form.querySelector('[name="name"]').value.trim().slice(0, 100);
      const email = form.querySelector('[name="email"]').value.trim().slice(0, 255);
      const whatsapp = form.querySelector('[name="whatsapp"]').value.trim().slice(0, 30);
      const role = form.querySelector('[name="role"]').value.trim().slice(0, 50);
      const tr = TR[currentLang];

      // Dedup — already submitted
      if (localStorage.getItem('radox_wl_' + email)) {
        form.outerHTML = `<div class="success glass-card">${tr.whitelist.success}</div>`;
        return;
      }

      // Loading state
      const btn = form.querySelector('[type="submit"]');
      const btnText = btn.textContent;
      btn.disabled = true;
      btn.textContent = '...';
      btn.style.opacity = '0.6';

      // 1. Save to Google Sheets (primary — persistent storage)
      const payload = { name, email, whatsapp, role, lang: currentLang, ts: new Date().toISOString() };
      const sheetsReady = SHEETS_WEBHOOK !== 'GOOGLE_APPS_SCRIPT_URL_HERE';

      const save = sheetsReady
        ? fetch(SHEETS_WEBHOOK, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) })
        : Promise.resolve();

      save
        .then(() => {
          // 2. WhatsApp notification — only for high-touch leads (Company / VC)
          if (role === 'Company' || role === 'Empresa' || role.includes('VC') || role.includes('Partner') || role.includes('Parceiro')) {
            const msg = encodeURIComponent(`Radox Waitlist:\n${name}\n${email}\n${whatsapp}\n${role}`);
            window.open(`https://wa.me/5521994028261?text=${msg}`, '_blank');
          }

          localStorage.setItem('radox_wl_' + email, '1');
          form.outerHTML = `<div class="success glass-card">${tr.whitelist.success}</div>`;
        })
        .catch(() => {
          btn.disabled = false;
          btn.textContent = btnText;
          btn.style.opacity = '1';
        });
    });
  }

  /* ------------------------------------------------------------------ */
  /* PARTICLE ANIMATION (FloatingBlocks port)                            */
  /* ------------------------------------------------------------------ */
  function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0;
    let scrollY = 0;
    let time = 0;
    let animId = 0;

    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

    const count = Math.min(110, Math.floor(window.innerWidth / 12));
    const gold = { r: 253, g: 218, b: 36 };
    const particles = [];

    for (let i = 0; i < count; i++) {
      const layer = i < count * 0.3 ? 0 : i < count * 0.7 ? 1 : 2;
      const sizeMul = layer === 0 ? 0.6 : layer === 1 ? 1.2 : 1.8;
      particles.push({
        baseX: Math.random() * window.innerWidth,
        baseY: Math.random() * window.innerHeight,
        x: 0, y: 0,
        size: (2.5 + Math.random() * 3.5) * sizeMul,
        speed: 0.3 + Math.random() * 0.5,
        angle: Math.random() * Math.PI * 2,
        orbit: 35 + Math.random() * 90,
        phase: Math.random() * Math.PI * 2,
        alpha: (0.25 + Math.random() * 0.5) * (layer === 0 ? 0.35 : layer === 1 ? 0.7 : 1),
        layer
      });
    }

    // Off-screen buffer for back layer blur
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');

    function draw() {
      time += 0.004;
      ctx.clearRect(0, 0, w, h);

      // Center glow
      const gc = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.45);
      gc.addColorStop(0, `rgba(${gold.r},${gold.g},${gold.b},0.06)`);
      gc.addColorStop(0.5, `rgba(${gold.r},${gold.g},${gold.b},0.02)`);
      gc.addColorStop(1, `rgba(${gold.r},${gold.g},${gold.b},0)`);
      ctx.fillStyle = gc;
      ctx.fillRect(0, 0, w, h);

// Update positions
      for (const p of particles) {
        const ls = p.layer === 0 ? 0.5 : p.layer === 1 ? 0.9 : 1.3;
        const a = p.angle + time * p.speed * ls;
        const sf = p.layer === 0 ? 0.02 : p.layer === 1 ? 0.05 : 0.08;
        const so = (scrollY * sf) % h;
        p.x = p.baseX + Math.cos(a) * p.orbit + Math.sin(time * 0.6 + p.phase) * 25;
        p.y = ((p.baseY - so + h) % h) + Math.sin(a) * p.orbit * 0.6;
      }

      // Back layer (blurred)
      offCanvas.width = w;
      offCanvas.height = h;
      offCtx.clearRect(0, 0, w, h);
      const back = particles.filter(p => p.layer === 0);
      offCtx.lineWidth = 1;
      for (let i = 0; i < back.length; i++) {
        for (let j = i + 1; j < back.length; j++) {
          const dx = back[i].x - back[j].x, dy = back[i].y - back[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            offCtx.strokeStyle = `rgba(${gold.r},${gold.g},${gold.b},${(1 - dist / 200) * 0.2})`;
            offCtx.beginPath(); offCtx.moveTo(back[i].x, back[i].y); offCtx.lineTo(back[j].x, back[j].y); offCtx.stroke();
          }
        }
      }
      for (const p of back) {
        const pulse = 0.7 + Math.sin(time * 2.5 + p.phase) * 0.3;
        const fa = p.alpha * pulse;
        const gs = p.size * 5;
        const g = offCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, gs);
        g.addColorStop(0, `rgba(${gold.r},${gold.g},${gold.b},${fa * 0.4})`);
        g.addColorStop(1, `rgba(${gold.r},${gold.g},${gold.b},0)`);
        offCtx.fillStyle = g;
        offCtx.fillRect(p.x - gs, p.y - gs, gs * 2, gs * 2);
        const s = p.size * 0.6;
        offCtx.beginPath(); offCtx.moveTo(p.x, p.y - s); offCtx.lineTo(p.x + s, p.y); offCtx.lineTo(p.x, p.y + s); offCtx.lineTo(p.x - s, p.y); offCtx.closePath();
        offCtx.fillStyle = `rgba(${gold.r},${gold.g},${gold.b},${fa})`;
        offCtx.fill();
      }
      ctx.save(); ctx.filter = 'blur(3px)'; ctx.drawImage(offCanvas, 0, 0); ctx.restore();

      // Front layers
      const front = particles.filter(p => p.layer >= 1);
      ctx.lineWidth = 1;
      for (let i = 0; i < front.length; i++) {
        for (let j = i + 1; j < front.length; j++) {
          if (Math.abs(front[i].layer - front[j].layer) > 1) continue;
          const dx = front[i].x - front[j].x, dy = front[i].y - front[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            ctx.strokeStyle = `rgba(${gold.r},${gold.g},${gold.b},${(1 - dist / 200) * 0.35 * Math.min(front[i].alpha, front[j].alpha) * 2})`;
            ctx.beginPath(); ctx.moveTo(front[i].x, front[i].y); ctx.lineTo(front[j].x, front[j].y); ctx.stroke();
          }
        }
      }
      for (const p of front) {
        const pulse = 0.7 + Math.sin(time * 2.5 + p.phase) * 0.3;
        const fa = p.alpha * pulse;
        const gs = p.size * (p.layer === 2 ? 5 : 4);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, gs);
        g.addColorStop(0, `rgba(${gold.r},${gold.g},${gold.b},${fa * 0.45})`);
        g.addColorStop(0.5, `rgba(${gold.r},${gold.g},${gold.b},${fa * 0.1})`);
        g.addColorStop(1, `rgba(${gold.r},${gold.g},${gold.b},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(p.x - gs, p.y - gs, gs * 2, gs * 2);
        const s = p.size * 0.6;
        ctx.beginPath(); ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x + s, p.y); ctx.lineTo(p.x, p.y + s); ctx.lineTo(p.x - s, p.y); ctx.closePath();
        ctx.fillStyle = `rgba(${gold.r},${gold.g},${gold.b},${Math.min(fa * 1.3, 1)})`;
        ctx.fill();
        if (p.layer === 2) {
          const hs = p.size * 0.25;
          ctx.beginPath(); ctx.moveTo(p.x, p.y - hs); ctx.lineTo(p.x + hs, p.y); ctx.lineTo(p.x, p.y + hs); ctx.lineTo(p.x - hs, p.y); ctx.closePath();
          ctx.fillStyle = `rgba(255,245,180,${fa * 0.6})`;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(draw);
    }
    draw();
  }

  /* ------------------------------------------------------------------ */
  /* INIT                                                                */
  /* ------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initParticles();
    initForm();
    setLang('en'); // builds all dynamic sections
    observeReveals();

    // Language toggle
    document.getElementById('lang-btn').addEventListener('click', toggleLang);
    const mobileLangBtn = document.getElementById('mobile-lang-btn');
    if (mobileLangBtn) mobileLangBtn.addEventListener('click', toggleLang);
  });

  // Expose toggle globally for mobile menu
  window.toggleLang = toggleLang;
})();
