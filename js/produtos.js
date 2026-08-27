// TechStore - Catálogo de produtos (20 itens fictícios)
// Imagens via placehold.co - sem APIs externas

const produtos = [
    {
        id: 1,
        nome: "iPhone 15 Pro Max 256GB Titânio",
        categoria: "Smartphones",
        preco: 8999.00,
        precoAntigo: 9999.00,
        desconto: 10,
        imagem: "https://placehold.co/400x300/0f172a/ffffff?text=iPhone+15+Pro+Max",
        descricao: "O iPhone mais avançado com chip A17 Pro, câmera de 48MP e tela Super Retina XDR de 6.7 polegadas. Design em titânio ultra resistente.",
        especificacoes: ["Tela: 6.7\" Super Retina XDR 120Hz", "Chip: A17 Pro", "Câmera: 48MP + 12MP + 12MP", "Bateria: até 29h de vídeo", "Armazenamento: 256GB"]
    },
    {
        id: 2,
        nome: "Samsung Galaxy S23 Ultra 512GB",
        categoria: "Smartphones",
        preco: 6999.00,
        precoAntigo: 7999.00,
        desconto: 13,
        imagem: "https://placehold.co/400x300/1e293b/ffffff?text=Galaxy+S23+Ultra",
        descricao: "Galaxy S23 Ultra com S Pen integrada, câmera de 200MP e processador Snapdragon 8 Gen 2. Potência e criatividade sem limites.",
        especificacoes: ["Tela: 6.8\" Dynamic AMOLED 2X", "Processador: Snapdragon 8 Gen 2", "Câmera: 200MP principal", "RAM: 12GB", "Bateria: 5000mAh"]
    },
    {
        id: 3,
        nome: "Notebook Gamer Acer Nitro V15 i5 RTX 4050",
        categoria: "Notebooks",
        preco: 5499.00,
        precoAntigo: 6499.00,
        desconto: 15,
        imagem: "https://placehold.co/400x300/2563eb/ffffff?text=Acer+Nitro+V15",
        descricao: "Notebook gamer com Intel i5 13ª geração, RTX 4050 6GB e tela 144Hz. Ideal para jogos AAA e criação de conteúdo.",
        especificacoes: ["Processador: Intel Core i5-13420H", "Placa: RTX 4050 6GB", "RAM: 16GB DDR5", "SSD: 512GB NVMe", "Tela: 15.6\" 144Hz"]
    },
    {
        id: 4,
        nome: "MacBook Air 13\" M2 256GB",
        categoria: "Notebooks",
        preco: 8999.00,
        precoAntigo: 10999.00,
        desconto: 18,
        imagem: "https://placehold.co/400x300/e2e8f0/0f172a?text=MacBook+Air+M2",
        descricao: "Superfino e silencioso com chip M2, bateria de até 18 horas e tela Liquid Retina. Perfeito para produtividade e mobilidade.",
        especificacoes: ["Chip: Apple M2 8 núcleos", "RAM: 8GB unificada", "SSD: 256GB", "Tela: 13.6\" Liquid Retina", "Peso: 1.24kg"]
    },
    {
        id: 5,
        nome: "PC Gamer Completo RTX 4070 Ryzen 7 5700X",
        categoria: "Computadores",
        preco: 7499.00,
        precoAntigo: 8999.00,
        desconto: 17,
        imagem: "https://placehold.co/400x300/0f172a/60a5fa?text=PC+Gamer+RTX+4070",
        descricao: "PC gamer montado e otimizado para rodar qualquer jogo no ultra. Gabinete RGB, water cooler e fonte 750W 80 Plus.",
        especificacoes: ["CPU: Ryzen 7 5700X", "GPU: RTX 4070 12GB", "RAM: 32GB DDR4 3200MHz", "SSD: 1TB NVMe", "Fonte: 750W 80 Plus Bronze"]
    },
    {
        id: 6,
        nome: "Processador AMD Ryzen 7 5700X",
        categoria: "Processadores",
        preco: 1299.00,
        precoAntigo: 1599.00,
        desconto: 19,
        imagem: "https://placehold.co/400x300/dbeafe/1d4ed8?text=Ryzen+7+5700X",
        descricao: "8 núcleos, 16 threads e arquitetura Zen 3. Excelente custo-benefício para jogos e multitarefas, sem cooler box.",
        especificacoes: ["Soquete: AM4", "Núcleos: 8 / Threads: 16", "Clock: 3.4GHz até 4.6GHz", "Cache: 36MB", "TDP: 65W"]
    },
    {
        id: 7,
        nome: "Processador Intel Core i7-12700K",
        categoria: "Processadores",
        preco: 1899.00,
        precoAntigo: 2299.00,
        desconto: 17,
        imagem: "https://placehold.co/400x300/dbeafe/1e3a5f?text=i7-12700K",
        descricao: "12 núcleos híbridos (8P+4E) com desempenho topo de linha para jogos e produtividade. Desbloqueado para overclock.",
        especificacoes: ["Soquete: LGA1700", "Núcleos: 12 (8P+4E) 20 threads", "Clock: até 5.0GHz", "Cache: 25MB", "Gráficos: UHD 770"]
    },
    {
        id: 8,
        nome: "Placa de Vídeo RTX 4060 Ti 8GB Gigabyte",
        categoria: "Placas de vídeo",
        preco: 2499.00,
        precoAntigo: 2999.00,
        desconto: 17,
        imagem: "https://placehold.co/400x300/1e3a5f/ffffff?text=RTX+4060+Ti",
        descricao: "Arquitetura Ada Lovelace com DLSS 3 e Ray Tracing de última geração. Ótima para 1080p e 1440p no ultra.",
        especificacoes: ["Chip: AD106", "Memória: 8GB GDDR6", "Boost: 2540MHz", "Ray Tracing: 3ª geração", "Saídas: 3x DP + 1x HDMI"]
    },
    {
        id: 9,
        nome: "Placa de Vídeo RTX 4070 12GB MSI Ventus",
        categoria: "Placas de vídeo",
        preco: 3899.00,
        precoAntigo: 4799.00,
        desconto: 19,
        imagem: "https://placehold.co/400x300/0f172a/a5b4fc?text=RTX+4070+12GB",
        descricao: "Desempenho 4K com DLSS 3 e eficiência da Ada Lovelace. Modelo Ventus com 3 fans e baixíssimo ruído.",
        especificacoes: ["Chip: AD104", "Memória: 12GB GDDR6X", "Boost: 2475MHz", "DLSS: 3.0", "TDP: 200W"]
    },
    {
        id: 10,
        nome: "Memória RAM Corsair Vengeance 16GB DDR4 3200MHz",
        categoria: "Memórias RAM",
        preco: 299.00,
        precoAntigo: 399.00,
        desconto: 25,
        imagem: "https://placehold.co/400x300/f1f5f9/2563eb?text=RAM+16GB+Corsair",
        descricao: "Kit 2x8GB com dissipador de alumínio e perfil XMP. Ideal para upgrade imediato com estabilidade.",
        especificacoes: ["Capacidade: 16GB (2x8GB)", "Tipo: DDR4 3200MHz", "Latência: CL16", "Voltagem: 1.35V", "Dissipador: alumínio anodizado"]
    },
    {
        id: 11,
        nome: "Memória RAM Kingston Fury Beast 32GB DDR5 5600MHz",
        categoria: "Memórias RAM",
        preco: 699.00,
        precoAntigo: 899.00,
        desconto: 22,
        imagem: "https://placehold.co/400x300/eef2ff/1d4ed8?text=RAM+32GB+DDR5",
        descricao: "DDR5 de alta frequência com RGB sutil e compatibilidade Intel XMP e AMD EXPO. Futuro garantido.",
        especificacoes: ["Capacidade: 32GB (2x16GB)", "Tipo: DDR5 5600MHz", "Latência: CL40", "Recurso: RGB", "Compatível: XMP 3.0 / EXPO"]
    },
    {
        id: 12,
        nome: "SSD Kingston NV2 1TB NVMe PCIe 4.0",
        categoria: "SSDs",
        preco: 429.00,
        precoAntigo: 599.00,
        desconto: 28,
        imagem: "https://placehold.co/400x300/fff7ed/c2410c?text=SSD+1TB+NV2",
        descricao: "Leitura até 3500MB/s. Dê adeus à lentidão: boot em segundos e jogos carregando instantaneamente.",
        especificacoes: ["Capacidade: 1TB", "Interface: PCIe 4.0 NVMe", "Leitura: 3500MB/s", "Gravação: 2100MB/s", "Formato: M.2 2280"]
    },
    {
        id: 13,
        nome: "SSD Samsung 980 Pro 2TB NVMe",
        categoria: "SSDs",
        preco: 999.00,
        precoAntigo: 1399.00,
        desconto: 29,
        imagem: "https://placehold.co/400x300/0f172a/f59e0b?text=980+Pro+2TB",
        descricao: "Topo de linha com leitura de 7000MB/s e controlador Elpis. Confiabilidade Samsung para uso profissional.",
        especificacoes: ["Capacidade: 2TB", "Interface: PCIe 4.0 NVMe", "Leitura: 7000MB/s", "Gravação: 5100MB/s", "DRAM: 2GB LPDDR4"]
    },
    {
        id: 14,
        nome: "Monitor Gamer LG UltraGear 27\" 144Hz IPS",
        categoria: "Monitores",
        preco: 1399.00,
        precoAntigo: 1799.00,
        desconto: 22,
        imagem: "https://placehold.co/400x300/1e293b/ffffff?text=LG+27+144Hz",
        descricao: "27\" IPS 1ms, 144Hz e HDR10. Base ajustável e tecnologia FreeSync para gameplay fluido sem tearing.",
        especificacoes: ["Tamanho: 27\" IPS", "Resolução: 1920x1080", "Taxa: 144Hz 1ms", "Adaptive Sync: FreeSync", "Conexões: HDMI + DP"]
    },
    {
        id: 15,
        nome: "Monitor Samsung Odyssey G5 32\" Curvo 165Hz",
        categoria: "Monitores",
        preco: 2299.00,
        precoAntigo: 2999.00,
        desconto: 23,
        imagem: "https://placehold.co/400x300/334155/ffffff?text=Odyssey+32+Curvo",
        descricao: "Curvo 1000R com QHD, 165Hz e 1ms. Imersão total para jogos e produtividade com painel VA.",
        especificacoes: ["Tamanho: 32\" VA Curvo 1000R", "Resolução: 2560x1440 QHD", "Taxa: 165Hz 1ms", "Curvatura: 1000R", "HDR: HDR10"]
    },
    {
        id: 16,
        nome: "Teclado Mecânico Redragon Kumara RGB Switch Blue",
        categoria: "Teclados",
        preco: 199.00,
        precoAntigo: 299.00,
        desconto: 33,
        imagem: "https://placehold.co/400x300/dc2626/ffffff?text=Kumara+RGB",
        descricao: "Mecânico compacto ABNT2 com switch Outemu Blue, iluminação RGB e construção em metal. Custo-benefício gamer.",
        especificacoes: ["Switch: Outemu Blue (clicky)", "Layout: ABNT2 87 teclas", "Iluminação: RGB 6 modos", "Conexão: USB cabeado", "Anti-ghosting: total"]
    },
    {
        id: 17,
        nome: "Teclado Logitech MX Keys Sem Fio Iluminado",
        categoria: "Teclados",
        preco: 599.00,
        precoAntigo: 799.00,
        desconto: 25,
        imagem: "https://placehold.co/400x300/f8fafc/334155?text=MX+Keys",
        descricao: "Teclado premium com digitação perfeita, iluminação inteligente e conexão com até 3 dispositivos.",
        especificacoes: ["Conexão: Bluetooth + Unifying", "Bateria: até 10 dias c/ luz", "Teclas: esfericamente côncavas", "Compat.: Win/Mac/Linux", "Peso: 810g"]
    },
    {
        id: 18,
        nome: "Mouse Gamer Logitech G502 HERO 25600 DPI",
        categoria: "Mouses",
        preco: 299.00,
        precoAntigo: 399.00,
        desconto: 25,
        imagem: "https://placehold.co/400x300/0ea5e9/ffffff?text=G502+HERO",
        descricao: "Sensor HERO 25K, 11 botões programáveis e pesos ajustáveis. O mouse mais amado da comunidade gamer.",
        especificacoes: ["Sensor: HERO 25K", "DPI: 100 - 25600", "Botões: 11 programáveis", "Peso: ajustável 121g + 5x3.6g", "Cabo: trançado"]
    },
    {
        id: 19,
        nome: "Headset HyperX Cloud II 7.1 Surround",
        categoria: "Headsets",
        preco: 499.00,
        precoAntigo: 699.00,
        desconto: 29,
        imagem: "https://placehold.co/400x300/dc2626/fff?text=Cloud+II",
        descricao: "Conforto lendário com espuma memory foam, som 7.1 virtual e microfone removível. Campeão de vendas.",
        especificacoes: ["Drivers: 53mm", "Som: 7.1 virtual", "Microfone: removível c/ cancelamento", "Conexão: USB + P3", "Peso: 320g"]
    },
    {
        id: 20,
        nome: "Hub USB-C 7 em 1 Baseus",
        categoria: "Acessórios",
        preco: 189.00,
        precoAntigo: 249.00,
        desconto: 24,
        imagem: "https://placehold.co/400x300/334155/cbd5e1?text=Hub+USB-C+7in1",
        descricao: "Expanda seu notebook: HDMI 4K, 3x USB 3.0, SD/TF e PD 100W em alumínio premium. Essencial para produtividade.",
        especificacoes: ["Portas: HDMI 4K + 3x USB 3.0 + SD/TF + PD", "Material: alumínio", "Compat.: MacBook, Dell, Lenovo", "PD: 100W", "Garantia: 12 meses"]
    }
];
