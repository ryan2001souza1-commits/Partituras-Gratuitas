// TechStore - app.js
// Funções globais reutilizáveis | ETAPA 3-4-5-6-7

const CART_KEY = 'techstore_carrinho';
const THEME_KEY = 'techstore_tema';

function formatarPreco(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function mostrarToast(mensagem, tipo = 'success') {
    const container = document.getElementById('toast');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast__item toast__item--${tipo}`;
    el.textContent = mensagem;
    container.appendChild(el);
    setTimeout(() => {
        el.style.animation = 'toastOut .3s ease forwards';
        setTimeout(() => el.remove(), 300);
    }, 2800);
}

// Carrinho - LocalStorage
function getCarrinho() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
}
function salvarCarrinho(carrinho) {
    localStorage.setItem(CART_KEY, JSON.stringify(carrinho));
    atualizarContadorCarrinho();
}
function atualizarContadorCarrinho() {
    const carrinho = getCarrinho();
    const total = carrinho.reduce((s, i) => s + i.quantidade, 0);
    const el = document.getElementById('cart-count');
    if (el) el.textContent = total;
}
function adicionarAoCarrinho(id, quantidade = 1) {
    const produto = produtos.find(p => p.id === id);
    if (!produto) return;
    const carrinho = getCarrinho();
    const item = carrinho.find(i => i.id === id);
    const qtd = Math.max(1, parseInt(quantidade) || 1);
    if (item) item.quantidade += qtd;
    else carrinho.push({ id: produto.id, nome: produto.nome, preco: produto.preco, imagem: produto.imagem, quantidade: qtd });
    salvarCarrinho(carrinho);
    mostrarToast(`${qtd}× ${produto.nome} adicionado ao carrinho!`);
}

// Cria HTML do card - reutilizável
function criarCardProduto(produto) {
    const parcelado = (produto.preco / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const descontoHTML = produto.desconto ? `<span class="card__discount">-${produto.desconto}%</span>` : '';
    const precoAntigoHTML = produto.precoAntigo > produto.preco ? `<span class="card__old">${formatarPreco(produto.precoAntigo)}</span>` : '';
    const imagemHTML = produto.imagem
        ? `<img src="${produto.imagem}" alt="${produto.nome}" class="card__image" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid'">`
        : '';
    return `
        <article class="card">
            <div class="card__image-wrap">
                ${descontoHTML}
                <span class="card__category">${produto.categoria}</span>
                ${imagemHTML}
                <span class="card__image-placeholder" style="display:none">📦</span>
            </div>
            <div class="card__body">
                <h3 class="card__title"><a href="produto.html?id=${produto.id}">${produto.nome}</a></h3>
                <div class="card__price-row">
                    <span class="card__price">${formatarPreco(produto.preco)}</span>
                    ${precoAntigoHTML}
                </div>
                <span class="card__installment">12x de <strong>${parcelado}</strong> sem juros</span>
                <div class="card__actions">
                    <button class="btn btn--primary btn--sm" onclick="adicionarAoCarrinho(${produto.id})">Adicionar</button>
                    <a href="produto.html?id=${produto.id}" class="btn btn--ghost btn--sm">Ver</a>
                </div>
            </div>
        </article>
    `;
}

// HOME - destaques e ofertas
function renderHome() {
    const destaquesGrid = document.getElementById('destaques-grid');
    const ofertasGrid = document.getElementById('ofertas-grid');
    if (!destaquesGrid && !ofertasGrid) return;
    if (destaquesGrid) {
        const destaques = produtos.slice(0, 8);
        destaquesGrid.innerHTML = destaques.map(criarCardProduto).join('');
    }
    if (ofertasGrid) {
        const ofertas = [...produtos].sort((a, b) => b.desconto - a.desconto).slice(0, 4);
        ofertasGrid.innerHTML = ofertas.map(criarCardProduto).join('');
    }
}

// PRODUTOS.HTML - pesquisa, filtros e ordenação
function configurarProdutosPage() {
    const grid = document.getElementById('produtos-grid');
    if (!grid) return; // não está em produtos.html

    const filtroCategoria = document.getElementById('filtro-categoria');
    const filtroPreco = document.getElementById('filtro-preco');
    const ordenacao = document.getElementById('ordenacao');
    const resultCount = document.getElementById('result-count');
    const buscaTermoEl = document.getElementById('busca-termo');
    const limparBtn = document.getElementById('limpar-filtros');
    const searchInput = document.getElementById('search-input');

    const params = new URLSearchParams(window.location.search);
    const buscaParam = params.get('busca') || '';
    const categoriaParam = params.get('categoria') || '';

    // Preenche filtros a partir da URL (suporte links diretos ex: ?categoria=Smartphones)
    if (categoriaParam && filtroCategoria) filtroCategoria.value = categoriaParam;
    if (buscaParam && searchInput) searchInput.value = buscaParam;

    function aplicarFiltros() {
        let lista = [...produtos];
        const termo = (searchInput ? searchInput.value.trim().toLowerCase() : '');
        const categoria = filtroCategoria ? filtroCategoria.value : '';
        const precoRange = filtroPreco ? filtroPreco.value : '';
        const ordem = ordenacao ? ordenacao.value : '';

        // Busca textual (nome, categoria, descrição)
        if (termo) {
            lista = lista.filter(p =>
                p.nome.toLowerCase().includes(termo) ||
                p.categoria.toLowerCase().includes(termo) ||
                p.descricao.toLowerCase().includes(termo)
            );
            if (buscaTermoEl) buscaTermoEl.textContent = `Busca: "${searchInput.value.trim()}"`;
        } else {
            if (buscaTermoEl) buscaTermoEl.textContent = '';
        }

        // Categoria
        if (categoria) {
            lista = lista.filter(p => p.categoria === categoria);
        }

        // Preço
        if (precoRange) {
            const [min, max] = precoRange.split('-').map(Number);
            lista = lista.filter(p => p.preco >= min && p.preco <= max);
        }

        // Ordenação
        if (ordem === 'menor') lista.sort((a, b) => a.preco - b.preco);
        else if (ordem === 'maior') lista.sort((a, b) => b.preco - a.preco);
        else if (ordem === 'desconto') lista.sort((a, b) => b.desconto - a.desconto);
        else if (ordem === 'nome') lista.sort((a, b) => a.nome.localeCompare(b.nome));

        // Renderiza
        if (lista.length === 0) {
            grid.innerHTML = `<div class="empty-state"><p>Nenhum produto encontrado.</p><p style="font-size:.9rem">Tente ajustar os filtros ou a busca.</p></div>`;
        } else {
            grid.innerHTML = lista.map(criarCardProduto).join('');
        }

        if (resultCount) {
            resultCount.textContent = `${lista.length} produto${lista.length !== 1 ? 's' : ''} encontrado${lista.length !== 1 ? 's' : ''}`;
        }

        // Atualiza URL sem recarregar (para compartilhar)
        const newParams = new URLSearchParams();
        if (termo) newParams.set('busca', searchInput.value.trim());
        if (categoria) newParams.set('categoria', categoria);
        const newUrl = newParams.toString() ? `${window.location.pathname}?${newParams.toString()}` : window.location.pathname;
        history.replaceState(null, '', newUrl);
    }

    // Eventos
    if (filtroCategoria) filtroCategoria.addEventListener('change', aplicarFiltros);
    if (filtroPreco) filtroPreco.addEventListener('change', aplicarFiltros);
    if (ordenacao) ordenacao.addEventListener('change', aplicarFiltros);
    if (searchInput) {
        // busca ao vivo com debounce leve
        let t;
        searchInput.addEventListener('input', () => {
            clearTimeout(t);
            t = setTimeout(aplicarFiltros, 250);
        });
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                aplicarFiltros();
            }
        });
    }
    if (limparBtn) {
        limparBtn.addEventListener('click', () => {
            if (filtroCategoria) filtroCategoria.value = '';
            if (filtroPreco) filtroPreco.value = '';
            if (ordenacao) ordenacao.value = '';
            if (searchInput) searchInput.value = '';
            aplicarFiltros();
            mostrarToast('Filtros limpos');
        });
    }

    // Render inicial
    aplicarFiltros();
}

// Busca header - se estiver em produtos.html filtra ao vivo, senão redireciona
function configurarBusca() {
    const input = document.getElementById('search-input');
    const btn = document.getElementById('search-btn');
    if (!input) return;

    const isProdutosPage = !!document.getElementById('produtos-grid') && document.getElementById('filtro-categoria');

    function buscar() {
        const termo = input.value.trim();
        if (!termo) {
            if (isProdutosPage) {
                // limpar busca na própria página já é tratado por input event, mas garante
                const ev = new Event('input', { bubbles: true });
                input.dispatchEvent(ev);
                return;
            }
            mostrarToast('Digite algo para buscar', 'error');
            return;
        }
        if (isProdutosPage) {
            // já filtra ao vivo, só garante trigger
            const ev = new Event('input', { bubbles: true });
            input.dispatchEvent(ev);
        } else {
            window.location.href = `produtos.html?busca=${encodeURIComponent(termo)}`;
        }
    }

    if (btn) btn.addEventListener('click', buscar);
    // Enter já tratado dentro de configurarProdutosPage para produtos, e para outras páginas:
    if (!isProdutosPage) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') buscar();
        });
    }
}

// PRODUTO.HTML - página individual dinâmica
function configurarProdutoPage() {
    const container = document.getElementById('produto-detalhe');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get('id'));
    const produto = produtos.find(p => p.id === id);

    if (!produto) {
        container.innerHTML = `<div class="empty-state"><p>Produto não encontrado.</p><p style="font-size:.9rem">Verifique o link ou volte ao catálogo.</p><a href="produtos.html" class="btn btn--primary" style="margin-top:14px">Ver catálogo</a></div>`;
        document.title = 'Produto não encontrado | TechStore';
        return;
    }

    document.title = `${produto.nome} | TechStore`;
    const parcelado = (produto.preco / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const descontoBadge = produto.desconto ? `<span class="produto__badge">-${produto.desconto}% OFF</span>` : '';
    const precoAntigoHTML = produto.precoAntigo > produto.preco ? `<span class="produto__preco-antigo">${formatarPreco(produto.precoAntigo)}</span>` : '';
    const economia = produto.precoAntigo > produto.preco ? formatarPreco(produto.precoAntigo - produto.preco) : '';
    const especificacoesHTML = produto.especificacoes.map(e => `<li>${e}</li>`).join('');

    container.innerHTML = `
        <div class="produto-detalhe">
            <div class="produto__imagem-wrap">
                ${descontoBadge}
                <img src="${produto.imagem}" alt="${produto.nome}" onerror="this.style.display='none'">
            </div>
            <div class="produto__info">
                <span class="produto__categoria">${produto.categoria}</span>
                <h1 class="produto__nome">${produto.nome}</h1>
                <div class="produto__preco-row">
                    <span class="produto__preco">${formatarPreco(produto.preco)}</span>
                    ${precoAntigoHTML}
                </div>
                ${economia ? `<span class="produto__desconto">Economize ${economia} (${produto.desconto}% OFF)</span>` : ''}
                <p class="produto__parcelamento">12x de <strong>${parcelado}</strong> sem juros no cartão<br><span style="font-size:.85rem">ou ${formatarPreco(produto.preco * 0.9)} no PIX (10% OFF)</span></p>
                <p class="produto__descricao">${produto.descricao}</p>

                <div class="produto__acoes">
                    <div class="produto__qtd">
                        <button type="button" id="qtd-menos" aria-label="Diminuir">−</button>
                        <span id="qtd-valor">1</span>
                        <button type="button" id="qtd-mais" aria-label="Aumentar">+</button>
                    </div>
                    <button class="btn btn--primary" id="btn-add-produto" style="flex:1">Adicionar ao carrinho</button>
                </div>
                <a href="carrinho.html" style="display:inline-block; margin-top:10px; font-size:.9rem; color:var(--primary); text-decoration:none; font-weight:600">Ver carrinho →</a>

                <div class="produto__especs">
                    <h3>Especificações</h3>
                    <ul>${especificacoesHTML}</ul>
                </div>
            </div>
        </div>
    `;

    // Qtd handlers
    let qtd = 1;
    const qtdValor = document.getElementById('qtd-valor');
    document.getElementById('qtd-menos').addEventListener('click', () => {
        if (qtd > 1) { qtd--; qtdValor.textContent = qtd; }
    });
    document.getElementById('qtd-mais').addEventListener('click', () => {
        qtd++; qtdValor.textContent = qtd;
    });
    document.getElementById('btn-add-produto').addEventListener('click', () => {
        adicionarAoCarrinho(produto.id, qtd);
    });
}

// Auth header - integração com auth.js (ETAPA 5)
function getCurrentUserSafe() {
    if (window.TechStoreAuth && typeof window.TechStoreAuth.getCurrentUser === 'function') {
        try { return window.TechStoreAuth.getCurrentUser(); } catch { return null; }
    }
    try {
        const raw = localStorage.getItem('techstore_currentUser');
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}
function logoutSafe() {
    if (window.TechStoreAuth && typeof window.TechStoreAuth.logout === 'function') {
        window.TechStoreAuth.logout();
    } else {
        try { localStorage.removeItem('techstore_currentUser'); } catch {}
    }
}
function atualizarHeaderAuth() {
    let container = document.getElementById('auth-area');
    // fallback: injeta se página antiga ainda não tem o container (compat)
    if (!container) {
        const actions = document.querySelector('.header__actions');
        const cart = document.querySelector('.cart-icon');
        if (!actions) return;
        container = document.createElement('div');
        container.id = 'auth-area';
        container.className = 'auth-area';
        if (cart) actions.insertBefore(container, cart);
        else actions.appendChild(container);
    }
    const user = getCurrentUserSafe();
    if (user && user.nome) {
        const primeiro = user.nome.split(' ')[0];
        // escapa HTML básico
        const safeNome = primeiro.replace(/[<>&"]/g, s => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[s]));
        container.innerHTML = `
            <div class="auth-user" role="status" aria-live="polite">
                <span class="auth-user-name">Olá, <span>${safeNome}</span></span>
                <button type="button" class="auth-logout" id="logout-btn" aria-label="Sair da conta">Sair</button>
            </div>
        `;
        const btn = document.getElementById('logout-btn');
        if (btn) btn.addEventListener('click', () => {
            logoutSafe();
            mostrarToast(`Até logo, ${safeNome}!`, 'success');
            atualizarHeaderAuth();
            // se estiver em página que exige login futuro, apenas atualiza; não redireciona bruscamente
            setTimeout(() => {
                // opcional: recarrega para limpar estados dependentes
                // window.location.reload();
            }, 200);
        });
    } else {
        container.innerHTML = `
            <a href="login.html" class="auth-link">Entrar</a>
            <a href="cadastro.html" class="btn btn--primary btn--sm" style="padding:8px 14px; font-size:.85rem; border-radius:999px">Criar conta</a>
        `;
    }
}

// Menu mobile + Dark mode
function configurarUI() {
    const toggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('nav');
    if (toggle && nav) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = nav.classList.toggle('open');
            toggle.classList.toggle('open', isOpen);
            toggle.setAttribute('aria-expanded', isOpen);
        });
        // fecha ao clicar em link (mobile)
        nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
            nav.classList.remove('open');
            toggle.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        }));
        // fecha ao clicar fora
        document.addEventListener('click', (e) => {
            if (nav.classList.contains('open') && !nav.contains(e.target) && !toggle.contains(e.target)) {
                nav.classList.remove('open');
                toggle.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
        // fecha com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && nav.classList.contains('open')) {
                nav.classList.remove('open');
                toggle.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }
    const darkBtn = document.getElementById('dark-mode-btn');
    function atualizarIconeDark() {
        if (!darkBtn) return;
        const isDark = document.body.classList.contains('dark');
        darkBtn.textContent = isDark ? '☀' : '☾';
        darkBtn.setAttribute('aria-label', isDark ? 'Modo claro' : 'Modo escuro');
    }
    if (localStorage.getItem(THEME_KEY) === 'dark') document.body.classList.add('dark');
    atualizarIconeDark();
    if (darkBtn) {
        darkBtn.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark');
            localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
            atualizarIconeDark();
            mostrarToast(isDark ? 'Modo escuro ativado' : 'Modo claro ativado');
        });
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    atualizarContadorCarrinho();
    configurarUI();
    atualizarHeaderAuth();
    renderHome();
    configurarProdutosPage();
    configurarProdutoPage();
    configurarBusca();
});
