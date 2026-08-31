import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip as RTooltip
} from "recharts";
import {
  Ruler, Shield, AlertTriangle, Star, ChevronDown, ExternalLink,
  Fuel, Wrench, Receipt, TrendingDown, Info, RotateCcw, Check, X,
  Plus, Trash2, ClipboardList, Calendar
} from "lucide-react";

// ---------------------------------------------------------------------------
// DATA — raccolto durante la ricerca: annunci reali dove trovati, stime dove
// no (mai lasciate senza etichetta).
// ---------------------------------------------------------------------------

const MODELS = [
  {
    id: "yaris-cross", nome: "Toyota Yaris Cross Hybrid", gruppo: "Full hybrid", carrozzeria: "SUV",
    allestimenti: [
      { nome: "Business", prezzo: 20800 },
      { nome: "Trend", prezzo: 22900 },
      { nome: "GR Sport", prezzo: 24400 },
    ],
    wltp: 26.0, kw: 85, lunghezza: 4.18, bagagliaio: 397, bagagliaioMax: 1097,
    manutenzione: 275, tech: 8, valoreResiduoPct: 0.45, scarto: 0.10,
    ncapStelle: 4, ncapAnno: 2025,
    garanzia: "3 anni/100.000km, estensibile a 5 con tagliandi Toyota. Batteria ibrida: 10 anni con controllo annuale.",
    annuncio: { fonte: "AutoScout24, entro 200km da Padova", prezzo: "20.800–24.400€", url: "https://www.autoscout24.it/lst/toyota/yaris-cross/cit_padova" },
  },
  {
    id: "mg3", nome: "MG3 Hybrid+", gruppo: "Full hybrid", carrozzeria: "Berlina",
    allestimenti: [
      { nome: "Luxury (usato, 16-20.000km)", prezzo: 15450 },
      { nome: "Comfort (km0)", prezzo: 18490 },
    ],
    wltp: 22.7, kw: 100, lunghezza: 4.11, bagagliaio: 293, bagagliaioMax: 983,
    manutenzione: 220, tech: 6, valoreResiduoPct: 0.25, scarto: 0.10,
    ncapStelle: 4, ncapAnno: 2025,
    garanzia: "7 anni/150.000km — tra le più lunghe del mercato.",
    allerta: "Cedimento del meccanismo di aggancio del sedile guidatore riscontrato nel crash test Euro NCAP di settembre 2025 — mai osservato prima in 28 anni di test. Richiamo UK per ~2.000 veicoli (gen. 2026, immatricolati apr.2024–ago.2025). Verifica il VIN prima di acquistare.",
    nota: "Attenzione: alcuni annunci Luxury mostrano 143kW (194CV) invece dei 100kW qui modellati — verifica la potenza esatta sul libretto prima di calcolare il bollo, la differenza cambia l'importo.",
    annuncio: { fonte: "AutoScout24, varie sedi", prezzo: "14.900–18.490€", url: "https://www.autoscout24.it/lst/mg/mg3" },
  },
  {
    id: "captur", nome: "Renault Captur E-Tech Full Hybrid", gruppo: "Full hybrid", carrozzeria: "SUV",
    allestimenti: [
      { nome: "Techno 145cv (usato)", prezzo: 18900 },
      { nome: "Evolution 160cv (km0/promo)", prezzo: 24900 },
    ],
    wltp: 22.5, kw: 107, lunghezza: 4.23, bagagliaio: 400, bagagliaioMax: 1120,
    manutenzione: 300, tech: 9, valoreResiduoPct: 0.35, scarto: 0.12,
    ncapStelle: 5, ncapAnno: 2019,
    garanzia: "2 anni km illimitati (standard UE). Batteria E-Tech: 8 anni/160.000km.",
    nota: "openR Link con Google integrato nativo sugli allestimenti alti — il più vicino ai requisiti tech richiesti. Il 160cv km0/promo non va confuso con la Plug-in Hybrid, altro motore.",
    annuncio: { fonte: "Autobase Renault, Padova/Albignasego (145cv full hybrid)", prezzo: "18.750–19.390€", url: "https://autobase.concessionaria.renault.it/auto/usate/padova/renault/captur/" },
  },
  {
    id: "puma", nome: "Ford Puma EcoBoost Hybrid (automatico)", gruppo: "Mild hybrid", carrozzeria: "SUV",
    allestimenti: [
      { nome: "ST-Line X 125cv automatico", prezzo: 18500 },
    ],
    wltp: 20.4, kw: 92, lunghezza: 4.19, bagagliaio: 456, bagagliaioMax: 1216,
    manutenzione: 280, tech: 7, valoreResiduoPct: 0.38, scarto: 0.20,
    ncapStelle: 5, ncapAnno: 2019,
    garanzia: "3 anni/100.000km (2+1).",
    nota: "Bagagliaio più capiente della lista: 456L + 80L vano MegaBox. Un solo allestimento automatico trovato finora in zona — verifica se esistono altre versioni prima di scartare le alternative.",
    annuncio: { fonte: "AutoUncle/AutoScout24, zona Padova (ST-Line X 125CV automatico)", prezzo: "18.400–18.500€", url: "https://www.autouncle.it/it/auto-usate/Ford/Puma/in/Veneto/Padua" },
  },
  {
    id: "vitara", nome: "Suzuki Vitara Full Hybrid (automatico)", gruppo: "Full hybrid", carrozzeria: "SUV",
    allestimenti: [
      { nome: "140CV automatico", prezzo: 19500 },
    ],
    wltp: 18.5, kw: 85, lunghezza: 4.18, bagagliaio: 289, bagagliaioMax: 900,
    manutenzione: 300, tech: 5, valoreResiduoPct: 0.35, scarto: 0.12,
    ncapStelle: 5, ncapAnno: 2015,
    garanzia: "3 anni/100.000km, estensibile a 5.",
    annuncio: { fonte: "AutoScout24 (140CV, 2022)", prezzo: "18.500–19.500€", url: "https://www.autoscout24.it/lst/suzuki/vitara/ve_full-hybrid" },
  },
  {
    id: "stonic", nome: "Kia Stonic Mild Hybrid (automatico)", gruppo: "Mild hybrid", carrozzeria: "SUV",
    allestimenti: [
      { nome: "GT-Line 120cv automatico", prezzo: 18000 },
    ],
    wltp: 17.5, kw: 88, lunghezza: 4.14, bagagliaio: 352, bagagliaioMax: 1135,
    manutenzione: 230, tech: 6, valoreResiduoPct: 0.38, scarto: 0.20,
    ncapStelle: 3, ncapAnno: 2017,
    garanzia: "7 anni/150.000km — tra le più lunghe in assoluto.",
    annuncio: { fonte: "AutoScout24 (GT-Line 120CV, lug.2024, 12.000km, Padova)", prezzo: "18.000€", url: "https://www.autoscout24.it/lst/kia/stonic/padova" },
  },
  {
    id: "bayon", nome: "Hyundai Bayon Mild Hybrid (automatico)", gruppo: "Mild hybrid", carrozzeria: "SUV",
    allestimenti: [
      { nome: "XClass DCT", prezzo: 17400 },
    ],
    wltp: 18.0, kw: 74, lunghezza: 4.18, bagagliaio: 321, bagagliaioMax: 950,
    manutenzione: 230, tech: 6, valoreResiduoPct: 0.35, scarto: 0.20,
    ncapStelle: 4, ncapAnno: 2021,
    garanzia: "5 anni km illimitati.",
    nota: "Bagagliaio corretto a 321L (non 411L): sulla versione mild hybrid il modulo elettrico sotto il piano di carico riduce lo spazio rispetto alla versione benzina pura.",
    annuncio: { fonte: "alVolante, Padova (XClass DCT, dic.2023, 35.000km)", prezzo: "17.400€", url: "https://annunci.alvolante.it/auto-usate/hyundai-padova" },
  },
  {
    id: "tcross", nome: "VW T-Cross 1.0 TSI DSG", gruppo: "Benzina", carrozzeria: "SUV",
    allestimenti: [
      { nome: "Style 110cv DSG", prezzo: 18990 },
      { nome: "Life 115cv DSG", prezzo: 23000 },
    ],
    wltp: 17.5, kw: 85, lunghezza: 4.11, bagagliaio: 385, bagagliaioMax: 1281,
    manutenzione: 280, tech: 6, valoreResiduoPct: 0.40, scarto: 0.22,
    ncapStelle: 5, ncapAnno: 2019,
    garanzia: "2 anni km illimitati (standard UE).",
    nota: "Cluster di annunci 115CV DSG a Padova tra 22.490€ e 23.590€ (2024, 17-24.000km).",
    annuncio: { fonte: "alVolante, Padova (115CV DSG)", prezzo: "22.490–23.590€", url: "https://annunci.alvolante.it/auto-usate/volkswagen-t-cross-padova" },
  },
  {
    id: "taigo", nome: "VW Taigo 1.0 TSI 115 DSG", gruppo: "Benzina", carrozzeria: "SUV",
    allestimenti: [
      { nome: "R-Line 110cv", prezzo: 25400 },
    ],
    wltp: 17.2, kw: 85, lunghezza: 4.27, bagagliaio: 438, bagagliaioMax: 1222,
    manutenzione: 280, tech: 7, valoreResiduoPct: 0.40, scarto: 0.22,
    ncapStelle: 5, ncapAnno: 2022,
    garanzia: "2 anni km illimitati (standard UE).",
    annuncio: { fonte: "De Bona Motors, Padova (R-Line 110CV)", prezzo: "25.400€", url: "https://www.debona.it" },
  },
  {
    id: "kamiq", nome: "Skoda Kamiq 1.0 TSI 110 DSG", gruppo: "Benzina", carrozzeria: "SUV",
    allestimenti: [
      { nome: "Ambition 110cv DSG", prezzo: 18200 },
    ],
    wltp: 17.9, kw: 81, lunghezza: 4.24, bagagliaio: 400, bagagliaioMax: 1395,
    manutenzione: 270, tech: 7, valoreResiduoPct: 0.38, scarto: 0.22,
    ncapStelle: 5, ncapAnno: 2019,
    garanzia: "2 anni km illimitati (standard UE).",
    nota: "Il bagagliaio a sedili abbattuti (1.395L) è il più capiente di tutta la lista, full hybrid comprese.",
    annuncio: { fonte: "AutoScout24 (Ambition, 2023, 21.800km)", prezzo: "18.200€", url: "https://www.autoscout24.it/lst/skoda/kamiq" },
  },
  {
    id: "2008", nome: "Peugeot 2008 Hybrid 136 e-DCS6", gruppo: "Mild hybrid", carrozzeria: "SUV",
    allestimenti: [
      { nome: "Allure 136cv", prezzo: 22400 },
      { nome: "GT 136cv", prezzo: 24000 },
      { nome: "Style 136cv", prezzo: 27800 },
    ],
    wltp: 22.5, kw: 100, lunghezza: 4.30, bagagliaio: 434, bagagliaioMax: 1467,
    manutenzione: 300, tech: 8, valoreResiduoPct: 0.32, scarto: 0.20,
    ncapStelle: 5, ncapAnno: 2019,
    garanzia: "2 anni km illimitati, estensibile a pagamento.",
    nota: "Lunghezza dichiarata esattamente 4,30m — al limite esatto del garage, verifica l'allestimento scelto.",
    annuncio: { fonte: "Ghiraldo & Autoin, Padova (2023, 10.500km)", prezzo: "22.400–27.800€", url: "https://www.ghiraldo-autoin.it/auto/usate/padova/peugeot/2008/" },
  },
  {
    id: "qashqai", nome: "Nissan Qashqai e-Power", gruppo: "e-Power", carrozzeria: "SUV",
    allestimenti: [
      { nome: "N-Connecta 140cv (km0)", prezzo: 25900 },
      { nome: "Tekna 140cv (km0)", prezzo: 30900 },
    ],
    wltp: 22.2, kw: 103, lunghezza: 4.43, bagagliaio: 455, bagagliaioMax: 1400,
    manutenzione: 260, tech: 8, valoreResiduoPct: 0.40, scarto: 0.22,
    ncapStelle: 5, ncapAnno: 2021,
    garanzia: "3 anni/100.000km. Batteria/componenti e-Power: 8 anni/160.000km.",
    nota: "e-Power: il benzina fa solo da generatore. Ottima in città, ma cala parecchio in autostrada pura (12-13km/L nei test).",
    annuncio: { fonte: "AutoScout24/Campello Motors, Veneto (km0 140CV)", prezzo: "25.900–30.900€", url: "https://www.autoscout24.it/lst/nissan/qashqai/padova" },
  },
  {
    id: "yaris", nome: "Toyota Yaris Hybrid", gruppo: "Full hybrid", carrozzeria: "Berlina",
    allestimenti: [
      { nome: "Hybrid 115cv", prezzo: 16500 },
      { nome: "Hybrid 130cv", prezzo: 18500 },
    ],
    wltp: 24.0, kw: 85, lunghezza: 3.94, bagagliaio: 286, bagagliaioMax: 800,
    manutenzione: 230, tech: 7, valoreResiduoPct: 0.45, scarto: 0.10,
    ncapStelle: 4, ncapAnno: 2025,
    garanzia: "3 anni/100.000km, estensibile a 5 con tagliandi Toyota. Batteria ibrida: 10 anni con controllo annuale.",
    nota: "Più corta e più economica della Yaris Cross (39cm in meno), ma bagagliaio molto più piccolo (286L, il più ridotto di tutta la lista) — niente assetto rialzato da SUV.",
    annuncio: { fonte: "AutoScout24 (116CV, 06/2022, 93.751km)", prezzo: "16.490€", url: "https://www.autoscout24.it/lst/toyota/yaris/ve_hybrid" },
  },
  {
    id: "fiat600", nome: "Fiat 600 Hybrid", gruppo: "Mild hybrid", carrozzeria: "SUV",
    allestimenti: [
      { nome: "Hybrid 110cv", prezzo: 17500 },
      { nome: "Hybrid 145cv / La Prima", prezzo: 22000 },
    ],
    wltp: 20.2, kw: 81, lunghezza: 4.18, bagagliaio: 385, bagagliaioMax: 1256,
    manutenzione: 260, tech: 6, valoreResiduoPct: 0.32, scarto: 0.20,
    ncapStelle: null, ncapAnno: null, ncapNonTestata: true,
    garanzia: "2 anni km illimitati (standard UE).",
    nota: "Non risulta testata da Euro NCAP: nessun rating ufficiale trovato, non solo un dato incerto. Nel punteggio ponderato conta come valore neutro (né buono né scarso) proprio perché non c'è un test da cui partire — non un voto reale. Se la sicurezza pesa molto per te, è un'incognita vera, non solo un numero da verificare.",
    annuncio: { fonte: "AutoScout24, varie sedi (usato nazionale)", prezzo: "17.490–18.950€", url: "https://www.autoscout24.it/auto/fiat/fiat-600/" },
  },
  {
    id: "c3aircross", nome: "Citroën C3 Aircross Hybrid 136", gruppo: "Mild hybrid", carrozzeria: "SUV",
    allestimenti: [
      { nome: "Hybrid 136cv (nuovo)", prezzo: 24790 },
    ],
    wltp: 20.0, kw: 100, lunghezza: 4.395, bagagliaio: 460, bagagliaioMax: 1600,
    manutenzione: 270, tech: 6, valoreResiduoPct: 0.30, scarto: 0.20,
    ncapStelle: 4, ncapAnno: 2024,
    garanzia: "2 anni km illimitati (standard UE).",
    nota: "ATTENZIONE lunghezza: la nuova generazione (motore Hybrid 136cv) è lunga 4,395m — 9,5cm oltre il tuo limite garage, non 4,15m come la vecchia serie. Gli annunci usati economici che si trovano oggi (da 13.700€ a Padova) sono quasi certamente la generazione precedente, più corta ma senza motore ibrido. ATTENZIONE sicurezza: esiste online la notizia di uno 'zero stelle' per una C3 Aircross — è il test Latin NCAP di un'auto DIVERSA prodotta in Brasile (2 soli airbag, non venduta in Europa), non questo modello. Il test Euro NCAP europeo di questa C3 Aircross conferma buone prestazioni generali con un punto debole nella protezione whiplash dei sedili posteriori.",
    annuncio: { fonte: "Listino ufficiale Citroën (Hybrid 136cv nuovo)", prezzo: "24.790€", url: "https://www.autoscout24.it/auto/citroen/citroen-c3/citroen-c3-aircross/" },
  },
  {
    id: "mokka", nome: "Opel Mokka Hybrid", gruppo: "Mild hybrid", carrozzeria: "SUV",
    allestimenti: [
      { nome: "Hybrid 145cv GS automatico", prezzo: 22500 },
    ],
    wltp: 19.0, kw: 107, lunghezza: 4.15, bagagliaio: 350, bagagliaioMax: 1105,
    manutenzione: 270, tech: 7, valoreResiduoPct: 0.35, scarto: 0.20,
    ncapStelle: 4, ncapAnno: 2021,
    garanzia: "2 anni km illimitati (standard UE). Batteria: 8 anni/100.000km (dato relativo alla versione elettrica, da confermare per la Hybrid).",
    nota: "Prezzo ancora stimato dal listino nuovo con deprezzamento tipico: non ho trovato un annuncio pulito per la Hybrid 145cv GS DCT6 automatico specifica, ma il range di mercato usato in Veneto (fino a 22.905€ per le più recenti) rende la stima plausibile, non solo inventata.",
    annuncio: { fonte: "Range di mercato Veneto (AutoUncle) — nessun singolo annuncio esatto verificato", prezzo: "~22.500€ (stima supportata)", url: "https://www.autouncle.it/it/auto-usate/Opel/Mokka/in/Veneto" },
  },
  {
    id: "jazz", nome: "Honda Jazz e:HEV", gruppo: "Full hybrid", carrozzeria: "Berlina",
    allestimenti: [
      { nome: "Elegance (km0, 107cv)", prezzo: 21840 },
      { nome: "Comfort (usato 2020, 68.800km)", prezzo: 13800 },
    ],
    wltp: 25.5, kw: 80, lunghezza: 4.04, bagagliaio: 304, bagagliaioMax: 1205,
    manutenzione: 220, tech: 6, valoreResiduoPct: 0.40, scarto: 0.10,
    ncapStelle: 5, ncapAnno: 2020,
    garanzia: "3 anni/100.000km, estensibile. Honda SENSING (ADAS) di serie su tutta la gamma.",
    nota: "Full hybrid vero (i-MMD), non mild hybrid — può muoversi a batteria pura a basse velocità come Toyota. Bagagliaio tra i più piccoli della lista (304L) ma i Sedili Magici Honda si abbattono in modi non standard, utile per carichi ingombranti anche se il volume dichiarato è modesto. Annuncio km0 trovato a Padova (Albignasego, Ceccato Automobili).",
    annuncio: { fonte: "AutoScout24/AutoUncle, Padova/Albignasego e Veneto", prezzo: "13.800–22.800€", url: "https://www.autouncle.it/it/auto-usate/Honda/Jazz/in/Veneto" },
  },
  {
    id: "formentor", nome: "Cupra Formentor 1.5 TSI Mild Hybrid", gruppo: "Mild hybrid", carrozzeria: "SUV",
    allestimenti: [
      { nome: "1.5 TSI 150cv DSG (usato)", prezzo: 28000 },
    ],
    wltp: 15.9, kw: 110, lunghezza: 4.45, bagagliaio: 420, bagagliaioMax: 1168,
    manutenzione: 320, tech: 8, valoreResiduoPct: 0.38, scarto: 0.20,
    ncapStelle: 5, ncapAnno: 2020,
    garanzia: "2 anni km illimitati (standard UE, gruppo Volkswagen).",
    nota: "ATTENZIONE: è l'unico modello dell'intera gamma Cupra sotto i 30.000€, ma è lungo 4,45m — 15cm oltre il tuo limite garage, il divario più ampio di tutta la lista (peggio della Qashqai). Nessun modello Cupra attuale entra nei 4,3m: Leon 4,37m, Born (elettrica) 4,32m. Bagagliaio e stelle NCAP stimati con confidenza moderata, non verificati con una fonte diretta in questa sessione. Prezzo usato al limite del tuo budget: verifica bene cosa include prima di considerarla.",
    annuncio: { fonte: "Subito.it, Padova/Veneto (1.5 TSI usato)", prezzo: "25.900–30.990€", url: "https://www.subito.it/annunci-italia/vendita/auto/cupra/formentor/ibrida/" },
  },
  {
    id: "ora5", nome: "GWM Ora 5 Hi2 Full Hybrid", gruppo: "Full hybrid", carrozzeria: "SUV",
    allestimenti: [
      { nome: "Origin Hi2 (nuovo)", prezzo: 28600 },
      { nome: "Premium Hi2 (promo lancio, scad. 31/08/2026)", prezzo: 26950 },
    ],
    wltp: 19.6, kw: 164, lunghezza: 4.471, bagagliaio: 390, bagagliaioMax: 1088,
    manutenzione: 280, tech: 8, valoreResiduoPct: 0.28, scarto: 0.15,
    ncapStelle: null, ncapAnno: null, ncapNonTestata: true,
    garanzia: "7 anni/150.000km su tutte le motorizzazioni. Batteria: 8 anni/160.000km. 3 anni di manutenzione ordinaria inclusi con la promo di lancio.",
    nota: "Marchio nuovo in Italia (vendite dal giugno 2026): nessuno storico di affidabilità o tenuta del valore residuo, la stima è quindi più incerta del solito — trattala come tale. Non risulta ancora testata da Euro NCAP (modello troppo recente). Lunga 4,471m: 17cm oltre il tuo limite garage. 223CV complessivi, cambio automatico, ADAS di serie molto completo (23 funzioni), CarPlay/Android Auto wireless. Il prezzo Premium a 26.950€ è una promozione a tempo (fino al 31/08/2026 secondo le fonti trovate) — verifica se è ancora attiva prima di contarci.",
    annuncio: { fonte: "Listino ufficiale GWM Italia (giugno 2026)", prezzo: "26.950–30.600€", url: "https://www.gwm-eu.com/it/news-list/2026/gwm_ora_5" },
  },
  {
    id: "corolla-ts", nome: "Toyota Corolla Touring Sports Hybrid", gruppo: "Full hybrid", carrozzeria: "Wagon",
    allestimenti: [
      { nome: "Active 1.8 (usato 2023, 128.000km)", prezzo: 18950 },
      { nome: "140cv automatico (km0/quasi nuovo)", prezzo: 29500 },
    ],
    wltp: 22.5, kw: 103, lunghezza: 4.66, bagagliaio: 581, bagagliaioMax: 1606,
    manutenzione: 280, tech: 8, valoreResiduoPct: 0.45, scarto: 0.10,
    ncapStelle: 5, ncapAnno: 2018,
    garanzia: "3 anni/100.000km, estensibile a 5 con tagliandi Toyota. Batteria ibrida: 10 anni con controllo annuale.",
    nota: "È il segmento C, non B: 4,66m, 48cm più lunga della Yaris Cross e con bagagliaio quasi doppio (581L base). L'unica wagon Toyota disponibile in questa fascia di prezzo — non esiste una wagon compatta come la Yaris. Entrambi gli annunci reali trovati a Padova (Ferri Auto Limena, Formulauto).",
    annuncio: { fonte: "Ferri Auto/Formulauto, Padova (Limena)", prezzo: "18.950–29.500€", url: "https://www.ferriauto.com/ricerca-auto/usate/toyota/corolla-touring-sports" },
  },
  {
    id: "mgzs", nome: "MG ZS Hybrid+", gruppo: "Full hybrid", carrozzeria: "SUV",
    allestimenti: [
      { nome: "Comfort (nuovo)", prezzo: 25490 },
    ],
    wltp: 22.7, kw: 100, lunghezza: 4.43, bagagliaio: 443, bagagliaioMax: 1166,
    manutenzione: 230, tech: 6, valoreResiduoPct: 0.25, scarto: 0.10,
    ncapStelle: 3, ncapAnno: 2017,
    garanzia: "7 anni/150.000km — tra le più lunghe del mercato.",
    nota: "ATTENZIONE lunghezza: 4,43m, 13cm oltre il tuo limite garage. ATTENZIONE sicurezza: le 3 stelle mostrate sono del test 2017 sulla generazione precedente — la nuova versione ha il passo allungato di 30cm e condivide lo schema ibrido della MG3, ma non risulta un retest Euro NCAP specifico trovato in questa sessione: il dato è probabilmente superato, non affidabile per la generazione attuale. Bagagliaio stimato con confidenza moderata. Prezzo di listino nuovo, nessun usato verificato.",
    annuncio: { fonte: "Listino ufficiale MG Italia", prezzo: "25.490€", url: "https://www.mgmotor.it" },
  },
  {
    id: "clio", nome: "Renault Clio TCe", gruppo: "Benzina", carrozzeria: "Berlina",
    allestimenti: [
      { nome: "TCe 115 Evolution (nuovo)", prezzo: 18900 },
    ],
    wltp: 18.9, kw: 85, lunghezza: 4.05, bagagliaio: 391, bagagliaioMax: 1069,
    manutenzione: 250, tech: 7, valoreResiduoPct: 0.35, scarto: 0.20,
    ncapStelle: 5, ncapAnno: 2019,
    garanzia: "2 anni km illimitati (standard UE).",
    nota: "NON è una vera berlina: Renault non vende berline compatte in Italia, la Clio (5 porte) è il sostituto più vicino. Esiste anche una versione E-Tech Full Hybrid 145cv, non prezzata in questa sessione — se ti interessa il full hybrid invece del benzina puro, dimmelo e la verifico. Prezzo di listino nuovo, nessun usato verificato in questa sessione.",
    annuncio: { fonte: "Listino ufficiale Renault Italia", prezzo: "18.900€", url: "https://www.renault.it/veicoli/nuove-vetture/clio.html" },
  },
  {
    id: "focus-sw", nome: "Ford Focus Estate EcoBoost Hybrid", gruppo: "Mild hybrid", carrozzeria: "Wagon",
    allestimenti: [
      { nome: "125cv mHEV automatico (usato, stima)", prezzo: 19500 },
    ],
    wltp: 18.9, kw: 92, lunghezza: 4.65, bagagliaio: 575, bagagliaioMax: 1620,
    manutenzione: 270, tech: 6, valoreResiduoPct: 0.30, scarto: 0.20,
    ncapStelle: 5, ncapAnno: 2018,
    garanzia: "3 anni/100.000km (2+1).",
    nota: "Produzione terminata a novembre 2025: oggi si trova solo usata, nessun nuovo/km0 possibile. Prezzo stimato per analogia con la Puma (stesso propulsore) — non ho trovato un annuncio specifico con prezzo esplicito in questa sessione, solo conferma che il mercato dell'usato a Padova esiste. Verifica un prezzo reale prima di fidartene.",
    annuncio: { fonte: "Quattroruote/Subito, Padova — nessun prezzo specifico verificato", prezzo: "~19.500€ (stima)", url: "https://www.quattroruote.it/auto-usate/annunci/marca-ford/modello-focus/regione-veneto/provincia-padova" },
  },
  {
    id: "swift", nome: "Suzuki Swift Mild Hybrid", gruppo: "Mild hybrid", carrozzeria: "Berlina",
    allestimenti: [
      { nome: "83cv (usato 2021)", prezzo: 13499 },
      { nome: "82cv (km0/nuovo)", prezzo: 16950 },
    ],
    wltp: 21.0, kw: 61, lunghezza: 3.86, bagagliaio: 265, bagagliaioMax: 589,
    manutenzione: 200, tech: 5, valoreResiduoPct: 0.35, scarto: 0.20,
    ncapStelle: null, ncapAnno: null, ncapNonTestata: true,
    garanzia: "3 anni/100.000km, estensibile a 5.",
    nota: "NON è una vera berlina: Suzuki non vende berline in Italia, la Swift (5 porte) è il sostituto più vicino, ed è anche l'auto più piccola e più economica di tutta la lista. Stelle Euro NCAP della generazione attuale non trovate con una fonte diretta in questa sessione — non presumere un buon punteggio solo perché altri modelli Suzuki lo hanno.",
    annuncio: { fonte: "AutoScout24, Padova e nazionale", prezzo: "13.499–16.950€", url: "https://www.autoscout24.it/lst/suzuki/swift/padova" },
  },
  {
    id: "i30-wagon", nome: "Hyundai i30 Wagon Mild Hybrid", gruppo: "Mild hybrid", carrozzeria: "Wagon",
    allestimenti: [
      { nome: "1.0 T-GDI 48V DCT (usato, praticamente nuovo)", prezzo: 17850 },
    ],
    wltp: 18.5, kw: 74, lunghezza: 4.585, bagagliaio: 602, bagagliaioMax: 1650,
    manutenzione: 250, tech: 6, valoreResiduoPct: 0.35, scarto: 0.20,
    ncapStelle: 5, ncapAnno: 2017,
    garanzia: "5 anni km illimitati.",
    nota: "Segmento C, non B: 4,585m, con un bagagliaio enorme (602L base, tra i più capienti di tutta la lista). Le 5 stelle mostrate sono del test 2017 sulla generazione originale, non ho trovato conferma di un retest sul facelift attuale — trattalo con cautela se la sicurezza pesa molto per te. Annuncio reale trovato: prezzo eccellente per un'auto praticamente a chilometro zero (100km, gennaio 2023).",
    annuncio: { fonte: "AutoScout24, nazionale (100km, 01/2023)", prezzo: "17.850€", url: "https://www.autoscout24.it/lst/hyundai/i30/ve_wagon" },
  },
  {
    id: "ceed-sw", nome: "Kia Ceed Sportswagon Mild Hybrid", gruppo: "Mild hybrid", carrozzeria: "Wagon",
    allestimenti: [
      { nome: "1.5 T-GDi MHEV DCT 140cv (nuovo)", prezzo: 33100 },
    ],
    wltp: 16.7, kw: 103, lunghezza: 4.60, bagagliaio: 625, bagagliaioMax: 1694,
    manutenzione: 260, tech: 6, valoreResiduoPct: 0.35, scarto: 0.20,
    ncapStelle: 4, ncapAnno: 2019,
    garanzia: "7 anni/150.000km — tra le più lunghe del mercato.",
    nota: "Prezzo di listino nuovo: 33.100€, sopra il tuo budget attuale di 30k (il semaforo prezzo la segnerà rossa finché non alzi la soglia budget nelle Assunzioni, o finché non trovi un usato più economico). Nessun annuncio usato verificato in questa sessione. Bagagliaio tra i più capienti della lista (625L base).",
    annuncio: { fonte: "Listino ufficiale Kia Italia — nessun usato verificato", prezzo: "33.100€", url: "https://www.alvolante.it/listino_auto/kia-ceed_sportswagon" },
  },
  {
    id: "golf", nome: "Volkswagen Golf eTSI Mild Hybrid", gruppo: "Mild hybrid", carrozzeria: "Berlina",
    allestimenti: [
      { nome: "Edition Plus DSG (km0)", prezzo: 25900 },
      { nome: "Style DSG (km0)", prezzo: 29500 },
    ],
    wltp: 19.4, kw: 85, lunghezza: 4.28, bagagliaio: 381, bagagliaioMax: 1237,
    manutenzione: 290, tech: 7, valoreResiduoPct: 0.42, scarto: 0.18,
    ncapStelle: 5, ncapAnno: 2019,
    garanzia: "2 anni km illimitati (standard UE).",
    nota: "NON è una vera berlina: VW non vende berline compatte in Italia (la Virtus/Jetta esistono solo fuori Europa), la Golf 5 porte è il sostituto più vicino. Entrambi gli annunci sono km0 reali a Padova (Superauto).",
    annuncio: { fonte: "Superauto SpA, Padova (km0)", prezzo: "25.900–29.500€", url: "https://www.superautospa.it/auto/tutte-tipologie/padova/volkswagen/golf/" },
  },
  {
    id: "golf-variant", nome: "Volkswagen Golf Variant eTSI Mild Hybrid", gruppo: "Mild hybrid", carrozzeria: "Wagon",
    allestimenti: [
      { nome: "eTSI automatico 116cv (km0)", prezzo: 33200 },
    ],
    wltp: 19.0, kw: 85, lunghezza: 4.63, bagagliaio: 611, bagagliaioMax: 1642,
    manutenzione: 300, tech: 7, valoreResiduoPct: 0.40, scarto: 0.18,
    ncapStelle: 5, ncapAnno: 2019,
    garanzia: "2 anni km illimitati (standard UE).",
    nota: "Prezzo sopra budget (33.200€) — annuncio reale km0 trovato in Lombardia, non a Padova specificamente, nessun usato più economico verificato in questa sessione.",
    annuncio: { fonte: "AutoScout24, Lombardia (km0, 10km)", prezzo: "33.200€", url: "https://www.autoscout24.it/lst/volkswagen/golf-variant/tr_automatico" },
  },
  {
    id: "208", nome: "Peugeot 208 PureTech", gruppo: "Benzina", carrozzeria: "Berlina",
    allestimenti: [
      { nome: "PureTech 75 Active (nuovo, GPL)", prezzo: 11790 },
      { nome: "PureTech 100 Allure (usato/promo)", prezzo: 13900 },
    ],
    wltp: 18.5, kw: 55, lunghezza: 4.06, bagagliaio: 311, bagagliaioMax: 1106,
    manutenzione: 240, tech: 7, valoreResiduoPct: 0.32, scarto: 0.22,
    ncapStelle: 5, ncapAnno: 2019,
    garanzia: "2 anni km illimitati, estensibile a pagamento.",
    nota: "NON è una vera berlina: Peugeot non vende berline compatte in Italia, la 208 (5 porte) è il sostituto più vicino. Cambio automatico non confermato su questi annunci specifici (molte 208 PureTech sono manuali) — verifica prima di contare sul dato. Prezzi reali trovati a Rubano (Padova).",
    annuncio: { fonte: "usato.it, Rubano (Padova)", prezzo: "11.790–13.900€", url: "https://padova.usato.it/annunci/auto" },
  },
  {
    id: "fabia", nome: "Skoda Fabia", gruppo: "Benzina", carrozzeria: "Berlina",
    allestimenti: [
      { nome: "1.0 MPI (usato, Padova)", prezzo: 14900 },
    ],
    wltp: 18.0, kw: 44, lunghezza: 4.11, bagagliaio: 380, bagagliaioMax: 1190,
    manutenzione: 230, tech: 6, valoreResiduoPct: 0.35, scarto: 0.22,
    ncapStelle: 4, ncapAnno: 2021,
    garanzia: "2 anni km illimitati (standard UE).",
    nota: "NON è una vera berlina: Skoda non vende berline compatte in Italia (la Slavia esiste in altri mercati, non confermata in Italia), la Fabia (5 porte) è il sostituto più vicino. NIENTE wagon Skoda in questo segmento: la Fabia Combi è stata eliminata dalla gamma dalla 4ª generazione (2021) in poi — l'unica wagon Skoda rimasta è la Octavia, un segmento più grande e non ancora verificata in questa sessione. Cambio automatico non confermato su questo annuncio specifico. Prezzo reale trovato a Padova (Superauto).",
    annuncio: { fonte: "Superauto SpA, Padova", prezzo: "14.900€", url: "https://www.superautospa.it/auto/tutte-tipologie/padova/skoda/fabia/" },
  },
  {
    id: "mazda2", nome: "Mazda2 Hybrid", gruppo: "Full hybrid", carrozzeria: "Berlina",
    allestimenti: [
      { nome: "1.5 Full Hybrid e-CVT", prezzo: 17900 },
    ],
    wltp: 24.0, kw: 85, lunghezza: 3.94, bagagliaio: 286, bagagliaioMax: 800,
    manutenzione: 240, tech: 6, valoreResiduoPct: 0.38, scarto: 0.10,
    ncapStelle: 4, ncapAnno: 2025,
    garanzia: "3 anni/100.000km (rete Mazda, non ha il programma di estensione Toyota Relax).",
    nota: "È letteralmente una Toyota Yaris ribadgeizzata: stesso motore 1.5 Full Hybrid, stesso cambio e-CVT, prodotta nello stesso stabilimento in accordo Mazda-Toyota — stessa lunghezza, stesso bagagliaio limitato della Yaris standard già in lista. Prezzo identico sia nuova (0km) sia usata (2023, 39.600km) negli annunci trovati: 17.900€ in entrambi i casi, segno di un listino fisso di rete più che di un vero mercato dell'usato.",
    annuncio: { fonte: "Mazda Best Selection, nazionale", prezzo: "17.900€", url: "https://www.mazdabestselection.it/cerca-la-tua-mazda-usata/" },
  },
  {
    id: "cx30", nome: "Mazda CX-30 Mild Hybrid", gruppo: "Mild hybrid", carrozzeria: "SUV",
    allestimenti: [
      { nome: "e-Skyactiv X 145cv MHEV (stima)", prezzo: 27000 },
    ],
    wltp: 17.5, kw: 107, lunghezza: 4.395, bagagliaio: 430, bagagliaioMax: 1406,
    manutenzione: 290, tech: 7, valoreResiduoPct: 0.38, scarto: 0.15,
    ncapStelle: 5, ncapAnno: 2019,
    garanzia: "3 anni/100.000km.",
    nota: "Lunga 4,395m — 9,5cm oltre il tuo limite garage. Prezzo stimato per deprezzamento da nuovo (~32-35.000€): non ho trovato un annuncio usato con importo esplicito in questa sessione, verifica prima di fidartene.",
    annuncio: { fonte: "Nessun annuncio con prezzo esplicito verificato in questa sessione", prezzo: "~27.000€ (stima)", url: "https://www.autoscout24.it/lst/mazda/cx-30/ve_hybrid" },
  },
  {
    id: "arona", nome: "Seat Arona", gruppo: "Benzina", carrozzeria: "SUV",
    allestimenti: [
      { nome: "1.0 EcoTSI 95cv (usato)", prezzo: 15800 },
      { nome: "1.0 EcoTSI FR 110cv (km0)", prezzo: 19300 },
    ],
    wltp: 19.2, kw: 70, lunghezza: 4.138, bagagliaio: 400, bagagliaioMax: 1280,
    manutenzione: 270, tech: 6, valoreResiduoPct: 0.35, scarto: 0.20,
    ncapStelle: 4, ncapAnno: 2017,
    garanzia: "2 anni km illimitati (standard UE).",
    nota: "Nessuna versione ibrida disponibile per la Arona, solo benzina puro. Cambio automatico non confermato sugli annunci trovati (la maggior parte è manuale) — verifica prima di contare sul dato. Le 4 stelle mostrate sono del test 2017, probabilmente datato.",
    annuncio: { fonte: "AutoUncle/De Bona, Padova e Veneto", prezzo: "15.800–19.300€", url: "https://www.autouncle.it/it/auto-usate/Seat/Arona/in/Veneto/Padua" },
  },
  {
    id: "ibiza", nome: "Seat Ibiza", gruppo: "Benzina", carrozzeria: "Berlina",
    allestimenti: [
      { nome: "1.0 EcoTSI 95cv (stima)", prezzo: 15000 },
    ],
    wltp: 19.0, kw: 70, lunghezza: 4.059, bagagliaio: 355, bagagliaioMax: 1165,
    manutenzione: 250, tech: 6, valoreResiduoPct: 0.32, scarto: 0.20,
    ncapStelle: 4, ncapAnno: 2021,
    garanzia: "2 anni km illimitati (standard UE).",
    nota: "NON è una vera berlina: Seat non vende berline in Italia, la Ibiza (5 porte) è il sostituto più vicino. Prezzo stimato: l'unico annuncio reale trovato (13.700€, De Bona Padova) era un 1.6 TDI diesel, non benzina come richiesto — non l'ho usato per non mischiare alimentazioni diverse. Verifica un prezzo benzina reale prima di fidartene.",
    annuncio: { fonte: "Nessun annuncio benzina verificato in questa sessione", prezzo: "~15.000€ (stima)", url: "https://www.autoscout24.it/lst/seat/ibiza/padova" },
  },
  {
    id: "leon-st", nome: "Seat Leon Sportstourer", gruppo: "Benzina", carrozzeria: "Wagon",
    allestimenti: [
      { nome: "1.0 TSI 90cv (usato)", prezzo: 16400 },
    ],
    wltp: 18.9, kw: 66, lunghezza: 4.64, bagagliaio: 620, bagagliaioMax: 1600,
    manutenzione: 290, tech: 7, valoreResiduoPct: 0.35, scarto: 0.20,
    ncapStelle: 5, ncapAnno: 2020,
    garanzia: "2 anni km illimitati (standard UE).",
    nota: "Cambio manuale sull'annuncio trovato (il 90cv è tipicamente solo manuale) — la versione DSG automatica esiste su allestimenti superiori, non verificata in questa sessione. Bagagliaio molto capiente (620L base).",
    annuncio: { fonte: "De Bona, Padova", prezzo: "16.400€", url: "https://www.debona.it/auto/usate/tutte-citta/seat/" },
  },
  {
    id: "duster", nome: "Dacia Duster Eco-G", gruppo: "Benzina", carrozzeria: "SUV",
    allestimenti: [
      { nome: "1.2 Eco-G Journey 120cv automatico GPL (km0)", prezzo: 25490 },
    ],
    wltp: 15.4, kw: 88, lunghezza: 4.34, bagagliaio: 472, bagagliaioMax: 1614,
    manutenzione: 260, tech: 6, valoreResiduoPct: 0.35, scarto: 0.20,
    ncapStelle: 3, ncapAnno: 2024,
    garanzia: "3 anni/100.000km, estensibile.",
    nota: "Alimentazione GPL bi-fuel (Eco-G), non full hybrid — i consumi 'benzina' mostrati sono una stima equivalente, il costo reale al km col GPL è diverso (di solito più basso) da quello della benzina pura. Lunga 4,34m, appena sopra il tuo limite garage. Le 3 stelle Euro NCAP (test 2024 sulla generazione attuale) sono state molto discusse dalla stampa specializzata come deludenti per un SUV moderno — dato reale, non un errore.",
    annuncio: { fonte: "Autobase Dacia, Padova/Albignasego (km0)", prezzo: "25.490€", url: "https://autobase.concessionaria.dacia.it/auto/usate/padova/dacia/" },
  },
  {
    id: "jogger", nome: "Dacia Jogger Hybrid", gruppo: "Full hybrid", carrozzeria: "Wagon",
    allestimenti: [
      { nome: "1.6 Hybrid Extreme 140cv automatico (usato)", prezzo: 17490 },
    ],
    wltp: 20.4, kw: 103, lunghezza: 4.55, bagagliaio: 708, bagagliaioMax: 1819,
    manutenzione: 240, tech: 6, valoreResiduoPct: 0.32, scarto: 0.15,
    ncapStelle: 3, ncapAnno: 2022,
    garanzia: "3 anni/100.000km.",
    nota: "Tecnicamente una wagon/monovolume lunga (fino a 7 posti disponibili), non un SUV — bagagliaio il più grande di tutta la lista (708L base). Prezzo più basso di qualunque altra wagon full hybrid qui presente. Anche qui, come per la Duster, le 3 stelle NCAP sono un dato reale e discusso, non un errore — il posizionamento economico Dacia sembra avere un costo sistematico sulla sicurezza.",
    annuncio: { fonte: "Autobase Dacia, Padova", prezzo: "17.490€", url: "https://autobase.concessionaria.renault.it/auto/tutte-tipologie/padova/dacia/" },
  },
  {
    id: "sandero", nome: "Dacia Sandero Stepway", gruppo: "Benzina", carrozzeria: "Berlina",
    allestimenti: [
      { nome: "1.0 TCe Comfort (usato, manuale)", prezzo: 11990 },
    ],
    wltp: 18.0, kw: 67, lunghezza: 4.09, bagagliaio: 328, bagagliaioMax: 1108,
    manutenzione: 200, tech: 4, valoreResiduoPct: 0.30, scarto: 0.20,
    ncapStelle: 2, ncapAnno: 2021,
    garanzia: "3 anni/100.000km.",
    nota: "NON è una vera berlina, e nemmeno un'ibrida: è l'auto più economica di tutta la lista (11.990€), ma cambio manuale — nessun automatico trovato per la Sandero, potrebbe non esistere proprio in gamma. Le 2 stelle Euro NCAP (2021) sono le più basse di qualunque modello qui presente: un vero trade-off prezzo/sicurezza da conoscere, non solo un numero da ignorare per risparmiare.",
    annuncio: { fonte: "Autobase Dacia, Padova/Limena", prezzo: "11.990€", url: "https://autobase.concessionaria.dacia.it/auto/usate/padova/dacia/" },
  },
  {
    id: "junior", nome: "Alfa Romeo Junior Hybrid", gruppo: "Mild hybrid", carrozzeria: "SUV",
    allestimenti: [
      { nome: "1.2 145cv Hybrid eDCT6 Speciale (nuova da immatricolare, stima prezzo)", prezzo: 30500 },
    ],
    wltp: 18.2, kw: 107, lunghezza: 4.17, bagagliaio: 400, bagagliaioMax: 1280,
    manutenzione: 310, tech: 8, valoreResiduoPct: 0.35, scarto: 0.18,
    ncapStelle: 5, ncapAnno: 2024,
    garanzia: "2 anni km illimitati (standard UE).",
    nota: "Prezzo stimato: annuncio reale trovato a Padova (Salone dell'Auto Vivarini) ma senza l'importo esplicito nel risultato di ricerca — verifica prima di contare sul dato. Condivide la piattaforma CMP con Fiat 600, Jeep Avenger e Peugeot 2008/208: stessa base tecnica, brand diverso, posizionamento più premium (manutenzione e prezzo più alti di conseguenza). Una delle poche auto di tutta la lista comodamente sotto i 4,3m di lunghezza (4,17m).",
    annuncio: { fonte: "Salone dell'Auto Vivarini, Padova — importo non estratto dalla ricerca", prezzo: "~30.500€ (stima)", url: "https://www.automobile.it/alfa_romeo-junior-padova" },
  },
  {
    id: "avenger", nome: "Jeep Avenger Hybrid", gruppo: "Mild hybrid", carrozzeria: "SUV",
    allestimenti: [
      { nome: "1.2 110cv mild hybrid e-DCT (stima)", prezzo: 24500 },
    ],
    wltp: 18.9, kw: 81, lunghezza: 4.084, bagagliaio: 355, bagagliaioMax: 1050,
    manutenzione: 280, tech: 7, valoreResiduoPct: 0.35, scarto: 0.18,
    ncapStelle: 5, ncapAnno: 2023,
    garanzia: "2 anni km illimitati (standard UE).",
    nota: "Prezzo stimato: 26 annunci trovati a Padova ma nessuno con importo esplicito estratto dalla ricerca — verifica prima di contare sul dato. Stessa piattaforma CMP di Fiat 600/Alfa Junior/Peugeot 2008. Eletta Auto dell'Anno in Europa 2023.",
    annuncio: { fonte: "AutoSuperMarket, Padova — importo non estratto dalla ricerca", prezzo: "~24.500€ (stima)", url: "https://autosupermarket.it/auto-usate/jeep/avenger/in-provincia-di-padova" },
  },
];

const DEFAULT_ASSUMPTIONS = {
  fuelPrice: 1.75,
  kmYear: 20000,
  bolloRate100: 2.58,
  bolloRateOver100: 3.87,
  exemptYears: 3,
  horizon: 10,
  lengthLimit: 4.3,
  budgetMax: 30000,
  consThreshold: 18,
  consMin: 12, consMax: 24,
  costMax: 4000, costMin: 2200,
  bagMin: 250, bagMax: 500,
};

const DEFAULT_WEIGHTS = { consumi: 25, costo: 25, sicurezza: 20, tech: 15, bagagliaio: 15 };

const SORT_OPTIONS = [
  { id: "punteggio", label: "Punteggio", fn: (a, b) => b.punteggio - a.punteggio },
  { id: "prezzo", label: "Prezzo (dal più economico)", fn: (a, b) => a.prezzo - b.prezzo },
  { id: "consumi", label: "Consumi reali (dal migliore)", fn: (a, b) => b.consReale - a.consReale },
  { id: "costo", label: "Costo gestione annuo (dal più basso)", fn: (a, b) => a.costoGestione - b.costoGestione },
  { id: "bagagliaio", label: "Bagagliaio (dal più grande)", fn: (a, b) => b.bagagliaio - a.bagagliaio },
  { id: "sicurezza", label: "Sicurezza NCAP (dal migliore)", fn: (a, b) => b.ncapStelle - a.ncapStelle },
];

const STATI = [
  { id: "da_vedere", label: "Da vedere", color: "#5FB8D6" },
  { id: "contattato", label: "Contattato", color: "#E8A93B" },
  { id: "visto", label: "Visto di persona", color: "#C87DDE" },
  { id: "offerta", label: "Offerta fatta", color: "#7FD99A" },
  { id: "scartato", label: "Scartato", color: "#5E7590" },
  { id: "acquistato", label: "Acquistato", color: "#5FCB8F" },
];
const statoInfo = (id) => STATI.find((s) => s.id === id) || STATI[0];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const eur = (v) => v == null ? "—" : v.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const fmt1 = (v) => v == null ? "—" : v.toLocaleString("it-IT", { maximumFractionDigits: 1 });

function NumberField({ label, value, step, onChange }) {
  const [raw, setRaw] = useState(String(value));
  useEffect(() => { setRaw(String(value)); }, [value]);
  return (
    <label style={S.assumptionField}>
      <span>{label}</span>
      <input
        type="number" step={step} value={raw}
        onChange={(e) => {
          const v = e.target.value;
          setRaw(v);
          const num = parseFloat(v);
          if (!isNaN(num) && isFinite(num)) onChange(num);
        }}
        style={S.numInput}
      />
    </label>
  );
}

export default function App() {
  const [assumptions, setAssumptions] = useState(DEFAULT_ASSUMPTIONS);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [insurance, setInsurance] = useState({});
  const [tracking, setTracking] = useState([]);
  const [trimSelection, setTrimSelection] = useState({});
  const [sortBy, setSortBy] = useState("punteggio");
  const [hideGarageFail, setHideGarageFail] = useState(false);
  const [hideBudgetFail, setHideBudgetFail] = useState(false);
  const [carrozzeriaFilter, setCarrozzeriaFilter] = useState([]);
  const [selectedRadar, setSelectedRadar] = useState(["yaris-cross", "captur", "mg3"]);
  const [expanded, setExpanded] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [showAssumptions, setShowAssumptions] = useState(false);

  // ---- persistenza locale al browser: privata, nessun account, nessun server ----
  useEffect(() => {
    try {
      const ins = localStorage.getItem("confronto-auto:insurance");
      const w = localStorage.getItem("confronto-auto:weights");
      const trk = localStorage.getItem("confronto-auto:tracking");
      const trims = localStorage.getItem("confronto-auto:trims");
      const filt = localStorage.getItem("confronto-auto:filters");
      if (ins) setInsurance(JSON.parse(ins));
      if (w) setWeights(JSON.parse(w));
      if (trk) setTracking(JSON.parse(trk));
      if (trims) setTrimSelection(JSON.parse(trims));
      if (filt) {
        const f = JSON.parse(filt);
        if (f.sortBy) setSortBy(f.sortBy);
        if (typeof f.hideGarageFail === "boolean") setHideGarageFail(f.hideGarageFail);
        if (typeof f.hideBudgetFail === "boolean") setHideBudgetFail(f.hideBudgetFail);
        if (Array.isArray(f.carrozzeriaFilter)) setCarrozzeriaFilter(f.carrozzeriaFilter);
      }
    } catch (e) {
      // primo utilizzo su questo browser, o dato corrotto — si riparte da zero
    } finally {
      setLoaded(true);
    }
  }, []);

  const saveTracking = useCallback((next) => {
    setTracking(next);
    try { localStorage.setItem("confronto-auto:tracking", JSON.stringify(next)); } catch (e) {}
  }, []);

  const saveInsurance = useCallback((next) => {
    setInsurance(next);
    try { localStorage.setItem("confronto-auto:insurance", JSON.stringify(next)); } catch (e) {}
  }, []);

  const saveWeights = useCallback((next) => {
    setWeights(next);
    try { localStorage.setItem("confronto-auto:weights", JSON.stringify(next)); } catch (e) {}
  }, []);

  const saveTrimSelection = useCallback((next) => {
    setTrimSelection(next);
    try { localStorage.setItem("confronto-auto:trims", JSON.stringify(next)); } catch (e) {}
  }, []);

  const saveFilters = useCallback((next) => {
    if (next.sortBy !== undefined) setSortBy(next.sortBy);
    if (next.hideGarageFail !== undefined) setHideGarageFail(next.hideGarageFail);
    if (next.hideBudgetFail !== undefined) setHideBudgetFail(next.hideBudgetFail);
    if (next.carrozzeriaFilter !== undefined) setCarrozzeriaFilter(next.carrozzeriaFilter);
    try {
      const merged = {
        sortBy: next.sortBy ?? sortBy,
        hideGarageFail: next.hideGarageFail ?? hideGarageFail,
        hideBudgetFail: next.hideBudgetFail ?? hideBudgetFail,
        carrozzeriaFilter: next.carrozzeriaFilter ?? carrozzeriaFilter,
      };
      localStorage.setItem("confronto-auto:filters", JSON.stringify(merged));
    } catch (e) {}
  }, [sortBy, hideGarageFail, hideBudgetFail, carrozzeriaFilter]);

  // ---- calcoli ----
  const computed = useMemo(() => {
    const a = assumptions;
    return MODELS.map((m) => {
      const trimIdx = trimSelection[m.id] ?? 0;
      const allestimento = m.allestimenti[trimIdx] ?? m.allestimenti[0];
      const prezzo = allestimento.prezzo;

      const consReale = m.wltp / (1 + m.scarto);
      const carburante = a.kmYear / consReale * a.fuelPrice;
      const bollo4plus = m.kw <= 100 ? m.kw * a.bolloRate100 : 100 * a.bolloRate100 + (m.kw - 100) * a.bolloRateOver100;
      const bolloMedio = ((a.exemptYears * 0) + ((a.horizon - a.exemptYears) * bollo4plus)) / a.horizon;
      const ins = insurance[m.id];
      const hasIns = ins !== undefined && ins !== null && ins !== "" && !isNaN(ins);
      const costoGestione = hasIns ? carburante + Number(ins) + m.manutenzione + bolloMedio : null;
      const valoreResiduo = prezzo * m.valoreResiduoPct;
      const tco = hasIns ? prezzo + costoGestione * a.horizon : null;
      const costoNetto10 = hasIns ? tco - valoreResiduo : null;

      const scoreConsumi = clamp((consReale - a.consMin) / (a.consMax - a.consMin) * 10, 0, 10);
      const scoreCosto = hasIns ? clamp((a.costMax - costoGestione) / (a.costMax - a.costMin) * 10, 0, 10) : null;
      const scoreBagagliaio = clamp((m.bagagliaio - a.bagMin) / (a.bagMax - a.bagMin) * 10, 0, 10);
      const scoreSicurezza = m.ncapNonTestata ? 5 : m.ncapStelle * 2;
      const scoreTech = m.tech;

      const wSum = weights.consumi + weights.costo + weights.sicurezza + weights.tech + weights.bagagliaio;
      const punteggio = hasIns && wSum > 0
        ? (weights.consumi * scoreConsumi + weights.costo * scoreCosto + weights.sicurezza * scoreSicurezza +
           weights.tech * scoreTech + weights.bagagliaio * scoreBagagliaio) / wSum
        : null;

      const garageOk = m.lunghezza <= a.lengthLimit;
      const budgetOk = prezzo <= a.budgetMax;
      const consOk = consReale >= a.consThreshold;
      const ncapStale = m.ncapNonTestata ? false : (2026 - m.ncapAnno) > 6;

      return {
        ...m, prezzo, allestimentoNome: allestimento.nome, trimIdx,
        consReale, carburante, bollo4plus, bolloMedio, costoGestione,
        valoreResiduo, tco, costoNetto10, scoreConsumi, scoreCosto, scoreBagagliaio,
        scoreSicurezza, scoreTech, punteggio, garageOk, budgetOk, consOk, ncapStale, hasIns,
      };
    });
  }, [assumptions, weights, insurance, trimSelection]);

  const passesFilters = useCallback((m) => {
    if (hideGarageFail && !m.garageOk) return false;
    if (hideBudgetFail && !m.budgetOk) return false;
    if (carrozzeriaFilter.length > 0 && !carrozzeriaFilter.includes(m.carrozzeria)) return false;
    return true;
  }, [hideGarageFail, hideBudgetFail, carrozzeriaFilter]);

  const activeSort = SORT_OPTIONS.find((s) => s.id === sortBy) ?? SORT_OPTIONS[0];

  const ranked = useMemo(
    () => computed.filter((m) => m.hasIns).filter(passesFilters).sort(activeSort.fn),
    [computed, passesFilters, activeSort]
  );
  const unranked = useMemo(
    () => computed.filter((m) => !m.hasIns).filter(passesFilters),
    [computed, passesFilters]
  );

  const trackingByModel = useMemo(() => {
    const map = {};
    tracking.forEach((t) => { map[t.modelId] = (map[t.modelId] || 0) + 1; });
    return map;
  }, [tracking]);

  const radarData = useMemo(() => {
    const axes = [
      { key: "scoreConsumi", label: "Consumi" },
      { key: "scoreCosto", label: "Costo" },
      { key: "scoreSicurezza", label: "Sicurezza" },
      { key: "scoreTech", label: "Tech" },
      { key: "scoreBagagliaio", label: "Bagagliaio" },
    ];
    const chosen = computed.filter((m) => selectedRadar.includes(m.id));
    return axes.map((ax) => {
      const row = { axis: ax.label };
      chosen.forEach((m) => { row[m.nome] = m[ax.key] ?? 0; });
      return row;
    });
  }, [computed, selectedRadar]);

  const radarColors = ["#E8A93B", "#5FB8D6", "#C87DDE", "#7FD99A", "#F0806E"];

  const wSum = weights.consumi + weights.costo + weights.sicurezza + weights.tech + weights.bagagliaio;

  const maxLen = Math.max(...MODELS.map((m) => m.lunghezza), assumptions.lengthLimit) + 0.15;
  const limitPercent = (assumptions.lengthLimit / maxLen) * 100;
  const rulerModels = useMemo(() => [...MODELS].sort((a, b) => a.lunghezza - b.lunghezza), []);

  return (
    <div style={S.page}>
      <style>{FONT_IMPORT}</style>

      {/* ---------------- HERO: il metro da garage ---------------- */}
      <header style={S.hero}>
        <div style={S.heroInner}>
          <div style={S.eyebrow}><Ruler size={14} strokeWidth={2.5} /> CONTROLLO GARAGE</div>
          <h1 style={S.h1}>Entra o non entra.</h1>
          <p style={S.heroSub}>
            {MODELS.length} auto, misurate una per una contro il tuo garage da <strong style={{ color: C.accent }}>{assumptions.lengthLimit.toFixed(2)}&nbsp;m</strong>.
            Il resto — prezzo, consumi reali, sicurezza — conta solo per chi ci entra davvero.
          </p>

          <div style={S.ruler}>
            <div style={S.rulerAxis}>
              {[0, 1, 2, 3, 4].map((t) => (
                <div key={t} style={{ ...S.rulerTick, left: `${(t / maxLen) * 100}%` }}>
                  <span style={S.rulerTickLabel}>{t}m</span>
                </div>
              ))}
              <div style={{ ...S.limitLine, left: `${(assumptions.lengthLimit / maxLen) * 100}%` }}>
                <span style={{
                  ...S.limitLabel,
                  ...(limitPercent > 60
                    ? { left: "auto", right: 6, textAlign: "right" }
                    : { left: 6, right: "auto", textAlign: "left" }),
                }}>
                  IL TUO GARAGE — {assumptions.lengthLimit.toFixed(2)}m
                </span>
              </div>
            </div>

            {rulerModels.map((m) => {
              const ok = m.lunghezza <= assumptions.lengthLimit;
              return (
                <div key={m.id} style={S.rulerRow}>
                  <div style={S.rulerName}>{m.nome}</div>
                  <div style={S.rulerTrack}>
                    <div
                      style={{
                        ...S.rulerBar,
                        width: `${(m.lunghezza / maxLen) * 100}%`,
                        background: ok ? C.success : C.danger,
                      }}
                    />
                    <div style={{ ...S.limitLineThin, left: `${(assumptions.lengthLimit / maxLen) * 100}%` }} />
                  </div>
                  <div style={{ ...S.rulerValue, color: ok ? C.success : C.danger }}>
                    {m.lunghezza.toFixed(2)}m {ok ? <Check size={13} /> : <X size={13} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <main style={S.main}>
        {/* ---------------- CONTROLLI ---------------- */}
        <section style={S.panel}>
          <div style={S.panelHead}>
            <h2 style={S.h2}>Cosa conta di più per te</h2>
            <button style={S.ghostBtn} onClick={() => { saveWeights(DEFAULT_WEIGHTS); setAssumptions(DEFAULT_ASSUMPTIONS); }}>
              <RotateCcw size={13} /> Ripristina
            </button>
          </div>
          <p style={S.panelSub}>
            Sposta le leve: la classifica sotto si ricalcola all'istante. Devono sommare a 100 —
            {" "}<span style={{ color: wSum === 100 ? C.success : C.danger, fontWeight: 700 }}>oggi fanno {wSum}%</span>.
          </p>
          <div style={S.slidersGrid}>
            {[
              { key: "consumi", label: "Consumi reali" },
              { key: "costo", label: "Costo di gestione" },
              { key: "sicurezza", label: "Sicurezza (NCAP)" },
              { key: "tech", label: "Tecnologia" },
              { key: "bagagliaio", label: "Bagagliaio" },
            ].map((s) => (
              <div key={s.key} style={S.sliderRow}>
                <div style={S.sliderLabelRow}>
                  <span style={S.sliderLabel}>{s.label}</span>
                  <span style={S.sliderVal}>{weights[s.key]}%</span>
                </div>
                <input
                  type="range" min={0} max={60} value={weights[s.key]}
                  onChange={(e) => saveWeights({ ...weights, [s.key]: Number(e.target.value) })}
                  style={S.slider}
                />
              </div>
            ))}
          </div>

          <button style={S.linkBtn} onClick={() => setShowAssumptions((v) => !v)}>
            <Info size={13} /> {showAssumptions ? "Nascondi" : "Mostra"} le assunzioni di calcolo
            <ChevronDown size={13} style={{ transform: showAssumptions ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
          </button>

          {showAssumptions && (
            <div style={S.assumptionsGrid}>
              {[
                ["fuelPrice", "Prezzo benzina (€/L)", 0.1],
                ["kmYear", "Km/anno", 500],
                ["lengthLimit", "Limite garage (m)", 0.01],
                ["budgetMax", "Budget massimo (€)", 500],
                ["consThreshold", "Soglia consumi accettabile (km/L)", 0.5],
                ["horizon", "Orizzonte possesso (anni)", 1],
              ].map(([key, label, step]) => (
                <NumberField
                  key={key} label={label} step={step} value={assumptions[key]}
                  onChange={(num) => setAssumptions((prev) => ({ ...prev, [key]: num }))}
                />
              ))}
            </div>
          )}
        </section>

        {/* ---------------- CLASSIFICA ---------------- */}
        <section style={S.panel}>
          <h2 style={S.h2}>Classifica</h2>
          <p style={S.panelSub}>
            {ranked.length === 0
              ? "Aggiungi almeno un preventivo assicurativo qui sotto per vedere la classifica."
              : `${ranked.length} di ${MODELS.length} modelli in classifica — aggiungi le assicurazioni mancanti per completarla.`}
          </p>

          <div style={S.filterBar}>
            <label style={S.assumptionField}>
              <span>Ordina per</span>
              <select
                value={sortBy}
                onChange={(e) => saveFilters({ sortBy: e.target.value })}
                style={S.numInput}
              >
                {SORT_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
            <button
              onClick={() => saveFilters({ hideGarageFail: !hideGarageFail })}
              style={{ ...S.chip, ...(hideGarageFail ? S.chipActive : {}) }}
            >
              <Ruler size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
              Nascondi chi non entra in garage
            </button>
            <button
              onClick={() => saveFilters({ hideBudgetFail: !hideBudgetFail })}
              style={{ ...S.chip, ...(hideBudgetFail ? S.chipActive : {}) }}
            >
              Nascondi fuori budget
            </button>
            {["SUV", "Berlina", "Wagon"].map((c) => {
              const active = carrozzeriaFilter.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => {
                    const next = active ? carrozzeriaFilter.filter((x) => x !== c) : [...carrozzeriaFilter, c];
                    saveFilters({ carrozzeriaFilter: next });
                  }}
                  style={{ ...S.chip, ...(active ? S.chipActive : {}) }}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {(hideGarageFail || hideBudgetFail) && (() => {
            const hiddenCount = computed.length - computed.filter(passesFilters).length;
            return hiddenCount > 0 ? (
              <div style={S.filterHint}>{hiddenCount} modell{hiddenCount === 1 ? "o" : "i"} nascost{hiddenCount === 1 ? "o" : "i"} dai filtri attivi.</div>
            ) : null;
          })()}

          <div style={S.cardList}>
            {ranked.map((m, i) => (
              <ModelCard key={m.id} m={m} rank={i + 1} expanded={expanded === m.id}
                onToggle={() => setExpanded(expanded === m.id ? null : m.id)}
                insurance={insurance} saveInsurance={saveInsurance} assumptions={assumptions}
                trackCount={trackingByModel[m.id] || 0}
                trimSelection={trimSelection} saveTrimSelection={saveTrimSelection} />
            ))}
          </div>

          {unranked.length > 0 && (
            <>
              <div style={S.dividerLabel}>In attesa di preventivo assicurativo</div>
              <div style={S.cardList}>
                {unranked.map((m) => (
                  <ModelCard key={m.id} m={m} rank={null} expanded={expanded === m.id}
                    onToggle={() => setExpanded(expanded === m.id ? null : m.id)}
                    insurance={insurance} saveInsurance={saveInsurance} assumptions={assumptions}
                    trackCount={trackingByModel[m.id] || 0}
                    trimSelection={trimSelection} saveTrimSelection={saveTrimSelection} />
                ))}
              </div>
            </>
          )}
        </section>

        {/* ---------------- RADAR ---------------- */}
        <section style={S.panel}>
          <h2 style={S.h2}>Confronto diretto</h2>
          <p style={S.panelSub}>Scegli fino a 3 modelli da sovrapporre.</p>
          <div style={S.chipRow}>
            {MODELS.map((m) => {
              const active = selectedRadar.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    if (active) setSelectedRadar(selectedRadar.filter((x) => x !== m.id));
                    else if (selectedRadar.length < 3) setSelectedRadar([...selectedRadar, m.id]);
                  }}
                  style={{ ...S.chip, ...(active ? S.chipActive : {}) }}
                >
                  {m.nome.split(" ").slice(0, 2).join(" ")}
                </button>
              );
            })}
          </div>

          <div style={{ width: "100%", height: 380 }}>
            <ResponsiveContainer>
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke={C.gridLine} />
                <PolarAngleAxis dataKey="axis" tick={{ fill: C.textSecondary, fontSize: 12, fontFamily: "Inter" }} />
                <PolarRadiusAxis domain={[0, 10]} tick={{ fill: C.textFaint, fontSize: 10 }} axisLine={false} />
                {computed.filter((m) => selectedRadar.includes(m.id)).map((m, i) => (
                  <Radar key={m.id} name={m.nome} dataKey={m.nome}
                    stroke={radarColors[i]} fill={radarColors[i]} fillOpacity={0.18} strokeWidth={2} />
                ))}
                <RTooltip contentStyle={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: "Inter", fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ---------------- BREAK-EVEN ---------------- */}
        <BreakEvenSection computed={computed} assumptions={assumptions} />

        {/* ---------------- TRACCIAMENTO ---------------- */}
        <TrackingSection tracking={tracking} saveTracking={saveTracking} />

        {/* ---------------- FOOTER / METODOLOGIA ---------------- */}
        <section style={{ ...S.panel, ...S.footerPanel }}>
          <h2 style={S.h2}>Come leggere i numeri</h2>
          <ul style={S.footerList}>
            <li><strong>Consumi reali</strong> = WLTP dichiarato diviso per lo scarto tipico d'uso reale (10-12% le full hybrid, 20-22% benzina/mild hybrid) — mai il dato di scheda tecnica da solo.</li>
            <li><strong>Bollo</strong>: Veneto, esente i primi {assumptions.exemptYears} anni per le ibride, poi due fasce (fino e oltre 100kW). Alcune fonti citano tariffe leggermente diverse — verifica su infobollo.regione.veneto.it prima di decidere.</li>
            <li><strong>Incentivi statali</strong>: non inclusi. A fine luglio 2026 il MIMIT non ha confermato un ecobonus generalizzato 2026 per benzina/ibride non plug-in senza rottamazione.</li>
            <li><strong>Euro NCAP</strong>: le stelle da sole non bastano — un test di più di 6 anni (Suzuki Vitara 2015, Kia Stonic 2017) non riflette gli standard di sicurezza attuali, anche se il punteggio ufficiale resta quello.</li>
            <li>Prezzi verificati su annunci reali entro 200km da Padova (o nazionali, dove specificato) per 26 dei {MODELS.length} modelli. Dati più deboli su Fiat 600, C3 Aircross, Mokka, Cupra Formentor, GWM Ora 5, MG ZS Hybrid+, Ford Focus Estate, Kia Ceed Sportswagon, Mazda CX-30, Seat Ibiza, Alfa Romeo Junior e Jeep Avenger — vedi la nota su ciascuna card. Ricontrolla comunque prima di un acquisto: gli annunci usati cambiano nel giro di poche settimane.</li>
            <li><strong>Mitsubishi non incluso</strong>: l'ASX venduto oggi in Italia è tecnicamente la stessa auto della Renault Captur E-Tech (accordo di rebadging tra le due case) — già presente in lista, aggiungerla di nuovo sarebbe stato un doppione con un altro nome.</li>
            <li><strong>Pattern Dacia</strong>: sia la Duster (3 stelle, 2024) sia la Jogger (3 stelle, 2022) hanno punteggi Euro NCAP nettamente più bassi della media della lista, mentre la Sandero (2 stelle, 2021) è la più bassa di tutte — un trade-off prezzo/sicurezza sistematico del marchio, non un errore di dati.</li>
            <li><strong>Lacune reali dichiarate</strong>: Renault e MG non vendono wagon a benzina/ibrida in Italia (solo elettriche); Ford non ha più una berlina/compatta economica dal 2023; Skoda non ha più una wagon in questo segmento dalla 4ª generazione Fabia (2021) — l'unica wagon Skoda rimasta (Octavia) è di segmento superiore e non ancora verificata; Peugeot 308 SW non verificata in questa sessione. Nessuna di queste è una dimenticanza: il modello semplicemente non esiste o non è stato ancora controllato.</li>
            <li><strong>Carrozzeria (SUV/Berlina/Wagon)</strong>: la lista è in ricostruzione marca per marca — molte case automobilistiche non vendono più berline o station wagon compatte in Italia, quindi alcune caselle restano vuote per davvero, non per pigrizia della ricerca. Dove non esiste una vera berlina, uso la 5 porte più vicina e lo dichiaro nella nota del modello.</li>
            <li><strong>Bagagliaio a sedili abbattuti</strong>: confermato da fonti dirette per 9 modelli; per Captur E-Tech, Suzuki Vitara e Bayon è una stima proporzionale, segnalata nella card del modello.</li>
            <li><strong>Correzione Hyundai Bayon</strong>: il bagagliaio base è 321L, non 411L come inizialmente indicato — quel valore vale per la versione benzina pura, non per la mild hybrid che ha il modulo elettrico sotto il piano di carico.</li>
            <li><strong>Garanzia di fabbrica</strong>: mostrata per riferimento, ma per un'auto usata conta solo quella residua dalla data di immatricolazione — chiedi sempre il libretto di garanzia originale.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

function BreakEvenSection({ computed, assumptions }) {
  const [idA, setIdA] = useState("yaris-cross");
  const [idB, setIdB] = useState("mg3");

  const a = computed.find((m) => m.id === idA);
  const b = computed.find((m) => m.id === idB);

  const verdict = useMemo(() => {
    if (!a || !b || !a.hasIns || !b.hasIns) return null;
    const diffPrezzo = a.prezzo - b.prezzo;           // >0 = A più caro all'acquisto
    const diffCosto = b.costoGestione - a.costoGestione; // >0 = A risparmia ogni anno rispetto a B
    if (diffPrezzo <= 0 && diffCosto >= 0) return { tipo: "subito", chi: "A" };
    if (diffPrezzo >= 0 && diffCosto <= 0 && !(diffPrezzo === 0 && diffCosto === 0)) return { tipo: "mai", chi: "A" };
    // trade-off vero in entrambe le direzioni (A più caro ma risparmia, o A più economico ma costa di più a lungo
    // termine): stessa formula, il segno decide chi sta recuperando cosa — vedi il testo che la usa.
    const anni = diffPrezzo / diffCosto;
    return { tipo: "anni", anni, diffPrezzo, diffCosto };
  }, [a, b]);

  const rows = a && b ? [
    { label: "Prezzo (€)", va: a.prezzo, vb: b.prezzo, fmt: eur },
    { label: "Costo gestione annuo (€)", va: a.costoGestione, vb: b.costoGestione, fmt: eur },
    { label: "Valore residuo (€)", va: a.valoreResiduo, vb: b.valoreResiduo, fmt: eur },
    { label: "TCO 10 anni (€)", va: a.tco, vb: b.tco, fmt: eur },
    { label: "Costo netto 10 anni (€)", va: a.costoNetto10, vb: b.costoNetto10, fmt: eur, strong: true },
  ] : [];

  return (
    <section style={S.panel}>
      <h2 style={S.h2}>Break-even tra due modelli</h2>
      <p style={S.panelSub}>
        Se un'auto costa di più all'acquisto ma meno da gestire ogni anno, qui vedi dopo quanti anni
        recupera la differenza rispetto all'altra — o se non conviene mai sui soli numeri.
      </p>

      <div style={S.bePickerRow}>
        <label style={S.assumptionField}>
          <span>Modello A</span>
          <select value={idA} onChange={(e) => setIdA(e.target.value)} style={S.numInput}>
            {MODELS.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </label>
        <span style={S.beVs}>vs</span>
        <label style={S.assumptionField}>
          <span>Modello B</span>
          <select value={idB} onChange={(e) => setIdB(e.target.value)} style={S.numInput}>
            {MODELS.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </label>
      </div>

      {(!a?.hasIns || !b?.hasIns) ? (
        <div style={S.emptyState}>
          Serve il preventivo assicurativo di entrambi i modelli (inseriscilo nella card corrispondente in Classifica)
          per calcolare il break-even.
        </div>
      ) : (
        <>
          <div style={S.beTable}>
            <div style={S.beTableHeadRow}>
              <span></span>
              <span style={S.beColHead} title={a.nome}>{a.nome}</span>
              <span style={S.beColHead} title={b.nome}>{b.nome}</span>
            </div>
            {rows.map((r) => (
              <div key={r.label} style={S.beRow}>
                <span style={S.detailLabel}>{r.label}</span>
                <span style={{ ...S.detailValue, ...(r.strong ? { fontWeight: 700, color: C.text } : {}) }}>{r.fmt(r.va)}</span>
                <span style={{ ...S.detailValue, ...(r.strong ? { fontWeight: 700, color: C.text } : {}) }}>{r.fmt(r.vb)}</span>
              </div>
            ))}
          </div>

          <div style={S.beVerdict}>
            {verdict.tipo === "subito" && (
              <>
                <Check size={16} color={C.success} />
                <span><strong>{verdict.chi === "A" ? a.nome : b.nome}</strong> conviene da subito — costa uguale o meno sia all'acquisto sia da gestire, nessun pareggio da aspettare.</span>
              </>
            )}
            {verdict.tipo === "mai" && (
              <>
                <X size={16} color={C.danger} />
                <span><strong>{a.nome}</strong> costa di più sia all'acquisto sia da gestire rispetto a <strong>{b.nome}</strong> — non si ripaga mai sui soli numeri. Valuta solo per altri motivi (affidabilità, spazio, sicurezza).</span>
              </>
            )}
            {verdict.tipo === "anni" && (
              <>
                {verdict.anni > 0 && verdict.anni < assumptions.horizon ? <Check size={16} color={C.success} /> : <Info size={16} color={C.accent} />}
                <span>
                  <strong>{a.nome}</strong> costa {eur(Math.abs(verdict.diffPrezzo))} {verdict.diffPrezzo >= 0 ? "in più" : "in meno"} all'acquisto,
                  ma {verdict.diffCosto >= 0 ? "risparmia" : "spende in più"} {eur(Math.abs(verdict.diffCosto))}/anno di gestione.
                  {verdict.anni > 0
                    ? <> Pareggio dopo <strong>{fmt1(verdict.anni)} anni</strong>{verdict.anni > assumptions.horizon ? " — oltre il tuo orizzonte di possesso, quindi in pratica non conviene sui numeri" : ""}.</>
                    : <> La differenza non si ripaga: i numeri vanno nella direzione sbagliata.</>}
                </span>
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function TrackingSection({ tracking, saveTracking }) {
  const emptyForm = { modelId: MODELS[0].id, url: "", prezzo: "", km: "", anno: "", stato: "da_vedere", note: "" };
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [filterStato, setFilterStato] = useState("tutti");

  const addEntry = () => {
    if (!form.modelId) return;
    const entry = { ...form, id: `${Date.now()}`, data: new Date().toISOString().slice(0, 10) };
    saveTracking([entry, ...tracking]);
    setForm(emptyForm);
    setShowForm(false);
  };

  const updateStato = (id, stato) => {
    saveTracking(tracking.map((t) => (t.id === id ? { ...t, stato } : t)));
  };

  const removeEntry = (id) => {
    saveTracking(tracking.filter((t) => t.id !== id));
  };

  const visible = filterStato === "tutti" ? tracking : tracking.filter((t) => t.stato === filterStato);
  const modelName = (id) => MODELS.find((m) => m.id === id)?.nome || id;

  return (
    <section style={S.panel}>
      <div style={S.panelHead}>
        <h2 style={S.h2}><ClipboardList size={18} style={{ verticalAlign: -3, marginRight: 6 }} />Tracciamento ricerca</h2>
        <button style={S.ghostBtn} onClick={() => setShowForm((v) => !v)}>
          <Plus size={13} /> {showForm ? "Chiudi" : "Aggiungi annuncio"}
        </button>
      </div>
      <p style={S.panelSub}>
        Ogni auto vista, contattata o scartata — così quando torni qui tra due settimane ricordi cosa avevi già valutato.
      </p>

      {showForm && (
        <div style={S.trackForm}>
          <div style={S.trackFormGrid}>
            <label style={S.assumptionField}>
              <span>Modello</span>
              <select value={form.modelId} onChange={(e) => setForm({ ...form, modelId: e.target.value })} style={S.numInput}>
                {MODELS.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </label>
            <label style={S.assumptionField}>
              <span>Prezzo visto (€)</span>
              <input type="number" placeholder="es. 21500" value={form.prezzo}
                onChange={(e) => setForm({ ...form, prezzo: e.target.value })} style={S.numInput} />
            </label>
            <label style={S.assumptionField}>
              <span>Km</span>
              <input type="number" placeholder="es. 42000" value={form.km}
                onChange={(e) => setForm({ ...form, km: e.target.value })} style={S.numInput} />
            </label>
            <label style={S.assumptionField}>
              <span>Anno immatricolazione</span>
              <input type="number" placeholder="es. 2023" value={form.anno}
                onChange={(e) => setForm({ ...form, anno: e.target.value })} style={S.numInput} />
            </label>
            <label style={S.assumptionField}>
              <span>Stato</span>
              <select value={form.stato} onChange={(e) => setForm({ ...form, stato: e.target.value })} style={S.numInput}>
                {STATI.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
            <label style={S.assumptionField}>
              <span>Link annuncio</span>
              <input type="text" placeholder="https://..." value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })} style={S.numInput} />
            </label>
          </div>
          <label style={{ ...S.assumptionField, marginTop: 12 }}>
            <span>Note (concessionario, contatto, impressioni)</span>
            <textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
              style={{ ...S.numInput, resize: "vertical", fontFamily: "Inter" }} />
          </label>
          <button style={S.primaryBtn} onClick={addEntry}><Plus size={13} /> Salva annuncio</button>
        </div>
      )}

      {tracking.length > 0 && (
        <div style={S.chipRow}>
          <button onClick={() => setFilterStato("tutti")} style={{ ...S.chip, ...(filterStato === "tutti" ? S.chipActive : {}) }}>
            Tutti ({tracking.length})
          </button>
          {STATI.map((s) => {
            const count = tracking.filter((t) => t.stato === s.id).length;
            if (count === 0) return null;
            return (
              <button key={s.id} onClick={() => setFilterStato(s.id)}
                style={{ ...S.chip, ...(filterStato === s.id ? { background: `${s.color}26`, borderColor: s.color, color: s.color, fontWeight: 600 } : {}) }}>
                {s.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {tracking.length === 0 ? (
        <div style={S.emptyState}>
          Nessun annuncio ancora tracciato. Quando vai a vedere un'auto o trovi un annuncio interessante, aggiungilo qui —
          diventa la tua memoria della ricerca, non solo un confronto teorico.
        </div>
      ) : (
        <div style={S.cardList}>
          {visible.map((t) => {
            const info = statoInfo(t.stato);
            return (
              <div key={t.id} style={S.trackCard}>
                <div style={{ ...S.trackDot, background: info.color }} />
                <div style={S.trackMain}>
                  <div style={S.trackTitleRow}>
                    <span style={S.cardTitle}>{modelName(t.modelId)}</span>
                    {t.url && (
                      <a href={t.url} target="_blank" rel="noopener noreferrer" style={S.listingLink}>
                        <ExternalLink size={12} /> annuncio
                      </a>
                    )}
                  </div>
                  <div style={S.cardMetaRow}>
                    {t.prezzo && <span>{eur(Number(t.prezzo))}</span>}
                    {t.km && <span style={S.metaDot}>·</span>}
                    {t.km && <span>{Number(t.km).toLocaleString("it-IT")} km</span>}
                    {t.anno && <span style={S.metaDot}>·</span>}
                    {t.anno && <span>{t.anno}</span>}
                    <span style={S.metaDot}>·</span>
                    <span><Calendar size={11} style={{ verticalAlign: -2 }} /> {t.data}</span>
                  </div>
                  {t.note && <div style={S.trackNote}>{t.note}</div>}
                </div>
                <select value={t.stato} onChange={(e) => updateStato(t.id, e.target.value)}
                  style={{ ...S.numInput, width: "auto", color: info.color, fontWeight: 600, fontFamily: "Inter", fontSize: 12 }}>
                  {STATI.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <button style={S.iconBtn} onClick={() => removeEntry(t.id)} aria-label="Rimuovi">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ModelCard({ m, rank, expanded, onToggle, insurance, saveInsurance, assumptions, trackCount, trimSelection, saveTrimSelection }) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  const multiTrim = m.allestimenti.length > 1;
  return (
    <div style={{ ...S.card, ...(rank && rank <= 3 ? S.cardTop : {}) }}>
      <div style={S.cardHead} onClick={onToggle}>
        <div style={S.cardRank}>{medal || (rank ?? "—")}</div>
        <div style={S.cardMain}>
          <div style={S.cardTitleRow}>
            <span style={S.cardTitle}>{m.nome}</span>
            <span style={S.groupTag}>{m.gruppo}</span>
            <span style={S.bodyTag}>{m.carrozzeria}</span>
            {!m.garageOk && <span style={S.badgeDanger}><Ruler size={11} /> Non entra</span>}
            {m.allerta && <span style={S.badgeDanger}><AlertTriangle size={11} /> Sicurezza</span>}
            {trackCount > 0 && <span style={S.badgeTrack}><ClipboardList size={11} /> {trackCount} annunci tracciati</span>}
          </div>
          <div style={S.cardMetaRow}>
            <span><NcapStars stelle={m.ncapStelle} stale={m.ncapStale} nonTestata={m.ncapNonTestata} /></span>
            <span style={S.metaDot}>·</span>
            <span>{eur(m.prezzo)}{multiTrim ? ` (${m.allestimentoNome})` : ""}</span>
            <span style={S.metaDot}>·</span>
            <span>{fmt1(m.consReale)} km/L reali</span>
            <span style={S.metaDot}>·</span>
            <span>{m.bagagliaio}L / {m.bagagliaioMax}L abbattuti</span>
          </div>
        </div>
        <div style={S.cardScore}>
          {m.punteggio != null ? (
            <>
              <div style={S.scoreNum}>{fmt1(m.punteggio)}</div>
              <div style={S.scoreLabel}>/10</div>
            </>
          ) : (
            <div style={S.scorePending}>—</div>
          )}
        </div>
        <ChevronDown size={16} color={C.textFaint} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
      </div>

      {expanded && (
        <div style={S.cardBody}>
          {m.allerta && (
            <div style={S.alertBox}>
              <AlertTriangle size={16} color={C.danger} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{m.allerta}</span>
            </div>
          )}
          {m.nota && (
            <div style={S.noteBox}>
              <Info size={14} color={C.accent} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{m.nota}</span>
            </div>
          )}

          {multiTrim && (
            <div>
              <div style={S.trimLabel}>Allestimento (cambia il prezzo usato nei calcoli)</div>
              <div style={S.chipRow}>
                {m.allestimenti.map((al, idx) => (
                  <button
                    key={al.nome}
                    onClick={(e) => {
                      e.stopPropagation();
                      saveTrimSelection({ ...trimSelection, [m.id]: idx });
                    }}
                    style={{ ...S.chip, ...(idx === m.trimIdx ? S.chipActive : {}) }}
                  >
                    {al.nome} — {eur(al.prezzo)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={S.detailGrid}>
            <DetailRow icon={<Fuel size={13} />} label="Carburante annuo" value={eur(m.carburante)} />
            <DetailRow icon={<Receipt size={13} />} label="Bollo (medio, esenzione inclusa)" value={eur(m.bolloMedio)} />
            <DetailRow icon={<Wrench size={13} />} label="Manutenzione annua" value={eur(m.manutenzione)} />
            <DetailRow icon={<TrendingDown size={13} />} label="Valore residuo (10 anni)" value={eur(m.valoreResiduo)} />
            <DetailRow label="TCO 10 anni" value={eur(m.tco)} strong />
            <DetailRow label="Costo netto 10 anni" value={eur(m.costoNetto10)} strong />
          </div>

          <div style={S.warrantyBox}>
            <Shield size={14} color={C.textSecondary} style={{ flexShrink: 0, marginTop: 2 }} />
            <span><strong style={{ color: C.textSecondary }}>Garanzia di fabbrica:</strong> {m.garanzia} Per l'usato dipende dalla data di immatricolazione — verifica quanto resta prima di firmare.</span>
          </div>

          <label style={S.insLabel}>
            <span>Preventivo assicurativo annuo (€)</span>
            <input
              type="number" placeholder="es. 750"
              value={insurance[m.id] ?? ""}
              onChange={(e) => saveInsurance({ ...insurance, [m.id]: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              style={S.numInput}
            />
          </label>

          {m.annuncio && (
            <a href={m.annuncio.url} target="_blank" rel="noopener noreferrer" style={S.listingLink} onClick={(e) => e.stopPropagation()}>
              <ExternalLink size={13} />
              Annuncio reale — {m.annuncio.fonte}: <strong>{m.annuncio.prezzo}</strong>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value, strong }) {
  return (
    <div style={S.detailRow}>
      <span style={S.detailLabel}>{icon}{label}</span>
      <span style={{ ...S.detailValue, ...(strong ? { fontWeight: 700, color: C.text } : {}) }}>{value}</span>
    </div>
  );
}

function NcapStars({ stelle, stale, nonTestata }) {
  if (nonTestata) {
    return <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, border: `1px solid ${C.border}`, borderRadius: 4, padding: "1px 5px" }}>NCAP: non testata</span>;
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, opacity: stale ? 0.45 : 1 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={12} fill={i < stelle ? (stale ? C.textFaint : C.accent) : "none"} color={i < stelle ? (stale ? C.textFaint : C.accent) : C.border} />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// STILE
// ---------------------------------------------------------------------------

const C = {
  bg: "#0E1B2B",
  panel: "#152438",
  panelAlt: "#122036",
  border: "#25384F",
  gridLine: "#233549",
  text: "#F2F5F8",
  textSecondary: "#9FB1C4",
  textFaint: "#5E7590",
  accent: "#E8A93B",
  success: "#5FCB8F",
  danger: "#EF7C6E",
};

const FONT_IMPORT = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap');
`;

const S = {
  page: { minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', sans-serif", paddingBottom: 48 },
  hero: { borderBottom: `1px solid ${C.border}`, background: `linear-gradient(180deg, ${C.panelAlt}, ${C.bg})`, padding: "40px 20px 32px" },
  heroInner: { maxWidth: 880, margin: "0 auto" },
  eyebrow: { display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.12em", color: C.accent, fontWeight: 600, marginBottom: 12 },
  h1: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 700, margin: "0 0 10px", letterSpacing: "-0.01em" },
  heroSub: { color: C.textSecondary, fontSize: 14.5, lineHeight: 1.6, maxWidth: 620, margin: "0 0 28px" },
  ruler: { display: "flex", flexDirection: "column", gap: 6 },
  rulerAxis: { position: "relative", height: 24, marginBottom: 4, borderBottom: `1px solid ${C.border}` },
  rulerTick: { position: "absolute", top: 0, bottom: 0, borderLeft: `1px solid ${C.border}` },
  rulerTickLabel: { position: "absolute", top: -18, left: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.textFaint },
  limitLine: { position: "absolute", top: -6, height: 30, borderLeft: `2px dashed ${C.accent}`, zIndex: 1 },
  limitLabel: { position: "absolute", top: -32, left: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, color: C.accent, whiteSpace: "nowrap" },
  limitLineThin: { position: "absolute", top: -2, bottom: -2, borderLeft: `1.5px dashed ${C.accent}`, opacity: 0.6 },
  rulerRow: { display: "grid", gridTemplateColumns: "minmax(90px, 160px) 1fr minmax(58px, 80px)", alignItems: "center", gap: 8, height: 26 },
  rulerName: { fontSize: 12.5, color: C.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  rulerTrack: { position: "relative", height: 14, background: C.panelAlt, borderRadius: 3, overflow: "visible" },
  rulerBar: { position: "absolute", top: 0, bottom: 0, left: 0, borderRadius: 3, transition: "width .3s" },
  rulerValue: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" },

  main: { maxWidth: 880, margin: "0 auto", padding: "32px 20px 0", display: "flex", flexDirection: "column", gap: 24 },
  panel: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px 24px 26px" },
  panelHead: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" },
  h2: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 19, fontWeight: 600, margin: 0 },
  panelSub: { color: C.textSecondary, fontSize: 13, margin: "6px 0 20px", lineHeight: 1.55 },

  ghostBtn: { display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${C.border}`, color: C.textSecondary, borderRadius: 8, padding: "6px 12px", fontSize: 12.5, fontFamily: "Inter", cursor: "pointer" },
  linkBtn: { display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: C.accent, fontSize: 12.5, fontFamily: "Inter", fontWeight: 600, cursor: "pointer", padding: "10px 0 0" },

  slidersGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "18px 24px" },
  sliderRow: { display: "flex", flexDirection: "column", gap: 6 },
  sliderLabelRow: { display: "flex", justifyContent: "space-between", fontSize: 12.5 },
  sliderLabel: { color: C.textSecondary },
  sliderVal: { fontFamily: "'JetBrains Mono', monospace", color: C.accent, fontWeight: 600 },
  slider: { width: "100%", accentColor: C.accent },

  assumptionsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px 20px", marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` },
  assumptionField: { display: "flex", flexDirection: "column", gap: 5, fontSize: 12, color: C.textSecondary },
  numInput: { background: C.panelAlt, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 10px", color: C.text, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, width: "100%", boxSizing: "border-box" },

  cardList: { display: "flex", flexDirection: "column", gap: 10 },
  dividerLabel: { fontSize: 11.5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: C.textFaint, margin: "22px 0 12px" },
  filterBar: { display: "flex", alignItems: "flex-end", gap: 10, flexWrap: "wrap", marginBottom: 8 },
  filterHint: { fontSize: 11.5, color: C.textFaint, marginBottom: 14 },

  card: { border: `1px solid ${C.border}`, borderRadius: 12, background: C.panelAlt, overflow: "hidden" },
  cardTop: { borderColor: "rgba(232,169,59,0.4)" },
  cardHead: { display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", cursor: "pointer" },
  cardRank: { width: 28, textAlign: "center", fontSize: 16, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, flexShrink: 0 },
  cardMain: { flex: 1, minWidth: 0 },
  cardTitleRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  cardTitle: { fontSize: 14.5, fontWeight: 600, color: C.text },
  groupTag: { fontSize: 10.5, color: C.textFaint, border: `1px solid ${C.border}`, borderRadius: 5, padding: "1px 6px" },
  bodyTag: { fontSize: 10.5, fontWeight: 600, color: C.accent, border: `1px solid rgba(232,169,59,0.35)`, background: "rgba(232,169,59,0.08)", borderRadius: 5, padding: "1px 6px" },
  badgeDanger: { display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10.5, fontWeight: 600, color: C.danger, background: "rgba(239,124,110,0.12)", borderRadius: 5, padding: "2px 6px" },
  badgeTrack: { display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10.5, fontWeight: 600, color: "#5FB8D6", background: "rgba(95,184,214,0.12)", borderRadius: 5, padding: "2px 6px" },
  cardMetaRow: { display: "flex", alignItems: "center", gap: 8, rowGap: 4, flexWrap: "wrap", fontSize: 12, color: C.textSecondary, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" },
  metaDot: { color: C.textFaint },
  cardScore: { display: "flex", alignItems: "baseline", gap: 2, flexShrink: 0, minWidth: 46, justifyContent: "flex-end" },
  scoreNum: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: C.accent },
  scoreLabel: { fontSize: 11, color: C.textFaint },
  scorePending: { fontSize: 15, color: C.textFaint, fontFamily: "'JetBrains Mono', monospace" },

  cardBody: { padding: "0 16px 18px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 14 },
  alertBox: { display: "flex", gap: 8, background: "rgba(239,124,110,0.1)", border: `1px solid rgba(239,124,110,0.3)`, borderRadius: 8, padding: "10px 12px", fontSize: 12.5, color: "#F5C4BC", lineHeight: 1.5, marginTop: 14 },
  noteBox: { display: "flex", gap: 8, background: "rgba(232,169,59,0.08)", border: `1px solid rgba(232,169,59,0.25)`, borderRadius: 8, padding: "10px 12px", fontSize: 12.5, color: "#E9CFA0", lineHeight: 1.5, marginTop: 14 },
  warrantyBox: { display: "flex", gap: 8, fontSize: 12, color: C.textFaint, lineHeight: 1.55, paddingTop: 4 },

  detailGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px 20px" },
  detailRow: { display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "4px 0", borderBottom: `1px solid ${C.border}` },
  detailLabel: { display: "flex", alignItems: "center", gap: 6, color: C.textSecondary },
  detailValue: { fontFamily: "'JetBrains Mono', monospace", color: C.textSecondary },

  insLabel: { display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: C.textSecondary, maxWidth: 240 },
  trimLabel: { fontSize: 11.5, color: C.textFaint, marginBottom: 8 },
  listingLink: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.accent, textDecoration: "none" },

  chipRow: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  chip: { fontSize: 12, padding: "6px 12px", borderRadius: 20, border: `1px solid ${C.border}`, background: "transparent", color: C.textSecondary, cursor: "pointer", fontFamily: "Inter" },
  chipActive: { background: "rgba(232,169,59,0.15)", borderColor: C.accent, color: C.accent, fontWeight: 600 },

  footerPanel: { background: C.panelAlt },
  footerList: { margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5, color: C.textSecondary, lineHeight: 1.6 },

  trackForm: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 18 },
  trackFormGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px 16px" },
  primaryBtn: { display: "inline-flex", alignItems: "center", gap: 6, background: C.accent, border: "none", color: "#1B1204", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, fontFamily: "Inter", cursor: "pointer", marginTop: 14 },
  emptyState: { fontSize: 13, color: C.textFaint, border: `1px dashed ${C.border}`, borderRadius: 10, padding: "22px 18px", textAlign: "center", lineHeight: 1.6 },
  trackCard: { display: "flex", alignItems: "flex-start", gap: 12, border: `1px solid ${C.border}`, borderRadius: 10, background: C.panelAlt, padding: "12px 14px" },
  trackDot: { width: 8, height: 8, borderRadius: "50%", marginTop: 6, flexShrink: 0 },
  trackMain: { flex: 1, minWidth: 0 },
  trackTitleRow: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  trackNote: { fontSize: 12, color: C.textSecondary, marginTop: 6, lineHeight: 1.5, fontStyle: "italic" },
  iconBtn: { background: "transparent", border: "none", color: C.textFaint, cursor: "pointer", padding: 4, flexShrink: 0 },

  bePickerRow: { display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 20, flexWrap: "wrap" },
  beVs: { fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, fontSize: 13, paddingBottom: 9 },
  beTable: { display: "flex", flexDirection: "column", gap: 2, marginBottom: 18 },
  beTableHeadRow: { display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 12, paddingBottom: 8, marginBottom: 4, borderBottom: `1px solid ${C.border}` },
  beColHead: { fontSize: 12, fontWeight: 700, color: C.text, fontFamily: "'Space Grotesk', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  beRow: { display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 12, padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12.5 },
  beVerdict: { display: "flex", gap: 10, alignItems: "flex-start", background: C.panelAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", fontSize: 13, color: C.textSecondary, lineHeight: 1.6 },
};
