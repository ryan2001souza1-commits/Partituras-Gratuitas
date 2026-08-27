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
    if (produto.ativo === false) { mostrarToast('Produto desativado', 'error'); return; }
    const estoque = typeof produto.estoque === 'number' ? produto.estoque : 22;
    if (estoque === 0) { mostrarToast('Produto sem estoque', 'error'); return; }
    const carrinho = getCarrinho();
    const item = carrinho.find(i => i.id === id);
    const qtd = Math.max(1, parseInt(quantidade) || 1);
    const jaNoCarrinho = item ? item.quantidade : 0;
    if (estoque !== 0 && jaNoCarrinho + qtd > estoque) {
        mostrarToast(`Estoque insuficiente. Disponível: ${estoque}`, 'error');
        return;
    }
    if (item) item.quantidade += qtd;
    else carrinho.push({ id: produto.id, nome: produto.nome, preco: produto.preco, imagem: produto.imagem, quantidade: qtd });
    salvarCarrinho(carrinho);
    mostrarToast(`${qtd}× ${produto.nome} adicionado ao carrinho!`);
}

// Cria HTML do card - reutilizável (respeita estoque/ativo do admin)
function criarCardProduto(produto) {
    const parcelado = (produto.preco / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const descontoHTML = produto.desconto ? `<span class="card__discount">-${produto.desconto}%</span>` : '';
    const precoAntigoHTML = produto.precoAntigo > produto.preco ? `<span class="card__old">${formatarPreco(produto.precoAntigo)}</span>` : '';
    const imagemHTML = produto.imagem
        ? `<img src="${produto.imagem}" alt="${produto.nome}" class="card__image" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid'">`
        : '';
    const estoque = typeof produto.estoque === 'number' ? produto.estoque : 22;
    const ativo = produto.ativo !== false;
    let acaoHTML = `<button class="btn btn--primary btn--sm" onclick="adicionarAoCarrinho(${produto.id})">Adicionar</button>`;
    let estoqueBadge = '';
    if (!ativo) {
        acaoHTML = `<button class="btn btn--primary btn--sm" disabled style="background:#94a3b8; border-color:#94a3b8; cursor:not-allowed">Inativo</button>`;
        estoqueBadge = `<span style="font-size:.75rem; color:#64748b; font-weight:700; background:#f1f5f9; padding:3px 8px; border-radius:999px; border:1px solid var(--border)">Inativo</span>`;
    } else if (estoque === 0) {
        acaoHTML = `<button class="btn btn--primary btn--sm" disabled style="background:#94a3b8; border-color:#94a3b8; cursor:not-allowed">Sem estoque</button>`;
        estoqueBadge = `<span style="font-size:.75rem; color:#dc2626; font-weight:700; background:#fee2e2; padding:3px 8px; border-radius:999px; border:1px solid #fecaca">Sem estoque</span>`;
    } else if (estoque <= 10) {
        estoqueBadge = `<span style="font-size:.75rem; color:#92400e; font-weight:700; background:#fef3c7; padding:3px 8px; border-radius:999px; border:1px solid #fde68a">Estoque baixo: ${estoque}</span>`;
    }
    return `
        <article class="card" ${!ativo ? 'style="opacity:.72"' : ''}>
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
                ${estoqueBadge ? `<div style="margin-top:4px">${estoqueBadge}</div>` : ''}
                <div class="card__actions">
                    ${acaoHTML}
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
    const estoque = typeof produto.estoque === 'number' ? produto.estoque : 22;
    const ativo = produto.ativo !== false;
    let estoqueHTML = '';
    if (!ativo) estoqueHTML = `<div style="margin:12px 0; padding:10px 14px; background:#fee2e2; border:1px solid #fecaca; color:#991b1b; border-radius:10px; font-weight:700; font-size:.9rem">Produto desativado</div>`;
    else if (estoque === 0) estoqueHTML = `<div style="margin:12px 0; padding:10px 14px; background:#fee2e2; border:1px solid #fecaca; color:#991b1b; border-radius:10px; font-weight:700; font-size:.9rem">Sem estoque</div>`;
    else if (estoque <= 10) estoqueHTML = `<div style="margin:12px 0; padding:10px 14px; background:#fef3c7; border:1px solid #fde68a; color:#92400e; border-radius:10px; font-weight:700; font-size:.9rem">Estoque baixo: apenas ${estoque} unidades</div>`;
    else estoqueHTML = `<div style="margin:12px 0; font-size:.85rem; color:var(--success); font-weight:700">✓ Em estoque • Pronta entrega</div>`;

    container.innerHTML = `
        <div class="produto-detalhe">
            <div class="produto__imagem-wrap">
                ${descontoBadge}
                ${!ativo ? '<span style="position:absolute; top:16px; right:16px; background:#64748b; color:#fff; padding:6px 10px; border-radius:999px; font-weight:800; font-size:.82rem">Inativo</span>' : (estoque===0 ? '<span style="position:absolute; top:16px; right:16px; background:#dc2626; color:#fff; padding:6px 10px; border-radius:999px; font-weight:800; font-size:.82rem">Sem estoque</span>' : '')}
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
                ${estoqueHTML}
                <p class="produto__descricao">${produto.descricao}</p>

                <div class="produto__acoes">
                    <div class="produto__qtd">
                        <button type="button" id="qtd-menos" aria-label="Diminuir">−</button>
                        <span id="qtd-valor">1</span>
                        <button type="button" id="qtd-mais" aria-label="Aumentar">+</button>
                    </div>
                    <button class="btn btn--primary" id="btn-add-produto" style="flex:1" ${!ativo || estoque===0 ? 'disabled' : ''}>${!ativo ? 'Inativo' : estoque===0 ? 'Sem estoque' : 'Adicionar ao carrinho'}</button>
                </div>
                <a href="carrinho.html" style="display:inline-block; margin-top:10px; font-size:.9rem; color:var(--primary); text-decoration:none; font-weight:600">Ver carrinho →</a>

                <div class="produto__especs">
                    <h3>Especificações</h3>
                    <ul>${especificacoesHTML}</ul>
                </div>
            </div>
        </div>
    `;

    // Qtd handlers (respeita estoque)
    let qtd = 1;
    const qtdValor = document.getElementById('qtd-valor');
    const estoqueLimite = typeof produto.estoque === 'number' ? produto.estoque : 22;
    const ativoProd = produto.ativo !== false;
    if (!ativoProd || estoqueLimite === 0) {
        const menos = document.getElementById('qtd-menos');
        const mais = document.getElementById('qtd-mais');
        if (menos) menos.disabled = true;
        if (mais) mais.disabled = true;
    }
    document.getElementById('qtd-menos')?.addEventListener('click', () => {
        if (qtd > 1) { qtd--; if(qtdValor) qtdValor.textContent = qtd; }
    });
    document.getElementById('qtd-mais')?.addEventListener('click', () => {
        if (estoqueLimite !== 0 && qtd >= estoqueLimite) { mostrarToast(`Estoque máximo: ${estoqueLimite}`, 'error'); return; }
        qtd++; if(qtdValor) qtdValor.textContent = qtd;
    });
    document.getElementById('btn-add-produto')?.addEventListener('click', () => {
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
function isAdminSafe() {
    try {
        if (typeof isAdmin === 'function' && isAdmin()) return true;
        if (window.TechStoreAuth && typeof window.TechStoreAuth.isAdmin === 'function' && window.TechStoreAuth.isAdmin()) return true;
        const u = getCurrentUserSafe();
        return !!(u && u.autenticado && u.tipo === 'admin');
    } catch { return false; }
}
function atualizarHeaderAuth() {
    let container = document.getElementById('auth-area');
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
    const admin = isAdminSafe();
    if (user && user.nome) {
        const primeiro = user.nome.split(' ')[0];
        const safeNome = primeiro.replace(/[<>&"]/g, s => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[s]));
        if (admin) {
            // Admin: mostra Painel Admin + dropdown com Sair (mantém sessão até Sair)
            container.innerHTML = `
                <div class="auth-user auth-user--admin" role="status" aria-live="polite" id="admin-user-menu">
                    <button type="button" class="auth-user-trigger" id="admin-menu-trigger" aria-expanded="false" aria-haspopup="true">
                        <span class="auth-user-name">Olá, <span>${safeNome}</span></span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    <div class="auth-dropdown" id="admin-dropdown" role="menu">
                        <a href="admin/index.html" class="auth-dropdown__link" role="menuitem">Painel Admin</a>
                        <a href="admin/produtos.html" class="auth-dropdown__link" role="menuitem">Gerenciar produtos</a>
                        <button type="button" class="auth-dropdown__link auth-dropdown__link--logout" id="logout-btn" role="menuitem">Sair</button>
                    </div>
                </div>
                <a href="admin/index.html" class="btn btn--primary btn--sm admin-link-desktop" style="padding:8px 14px; font-size:.85rem; border-radius:999px; margin-left:4px">Painel Admin</a>
            `;
            // dropdown toggle
            const trigger = document.getElementById('admin-menu-trigger');
            const dropdown = document.getElementById('admin-dropdown');
            const menu = document.getElementById('admin-user-menu');
            if (trigger && dropdown && menu) {
                trigger.addEventListener('click', (e)=>{
                    e.stopPropagation();
                    const open = menu.classList.toggle('open');
                    trigger.setAttribute('aria-expanded', open);
                    dropdown.style.display = open ? 'grid' : 'none';
                });
                document.addEventListener('click', (e)=>{
                    if (!menu.contains(e.target)) {
                        menu.classList.remove('open');
                        trigger.setAttribute('aria-expanded','false');
                        dropdown.style.display='none';
                    }
                });
                document.addEventListener('keydown', (e)=>{
                    if (e.key==='Escape') {
                        menu.classList.remove('open');
                        trigger.setAttribute('aria-expanded','false');
                        dropdown.style.display='none';
                    }
                });
            }
        } else {
            container.innerHTML = `
                <div class="auth-user" role="status" aria-live="polite">
                    <span class="auth-user-name">Olá, <span>${safeNome}</span></span>
                    <button type="button" class="auth-logout" id="logout-btn" aria-label="Sair da conta">Sair</button>
                </div>
            `;
        }
        const btn = document.getElementById('logout-btn');
        if (btn) btn.addEventListener('click', () => {
            logoutSafe();
            mostrarToast(`Até logo, ${safeNome}!`, 'success');
            atualizarHeaderAuth();
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

// Sync catálogo com admin (ETAPA 4) — reflete edições sem recarregar manualmente
function recarregarProdutosDoAdmin() {
    try {
        const raw = localStorage.getItem('techstore_produtos_admin');
        if (!raw) return false;
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr) || !arr.length) return false;
        // normaliza estoque/ativo caso admin antigo tenha salvo sem
        const norm = arr.map(p=> ({
            ...p,
            estoque: typeof p.estoque === 'number' ? p.estoque : (Number(p.id)%7===0?0:Number(p.id)%5===0?4: Number(p.id)%3===0?8:22),
            ativo: typeof p.ativo === 'boolean' ? p.ativo : true
        }));
        // evita loop se já idêntico
        if (JSON.stringify(produtos) === JSON.stringify(norm)) return false;
        produtos.length = 0;
        norm.forEach(p=> produtos.push(p));
        return true;
    } catch { return false; }
}
const CONFIG_DEFAULT_FRONT = {
    nome: 'TechStore',
    telefone: '(11) 99999-0000',
    email: 'contato@techstore.com.br',
    fretePadrao: 19.90,
    bannerTag: 'Ofertas da semana',
    bannerTitulo: 'Tech que impulsiona você',
    bannerDescricao: 'Até 40% OFF em notebooks, placas de vídeo e smartphones. Frete grátis para todo o Brasil.'
};
function getConfigFrontend() {
    try {
        const raw = localStorage.getItem('techstore_config');
        if (raw) return { ...CONFIG_DEFAULT_FRONT, ...JSON.parse(raw) };
    } catch {}
    return { ...CONFIG_DEFAULT_FRONT };
}
function aplicarConfigNoFrontend() {
    const cfg = getConfigFrontend();
    // logo
    document.querySelectorAll('.logo').forEach(el=>{
        // preserva span se for TechStore, senão texto simples
        if (cfg.nome.toLowerCase().includes('techstore')) {
            el.innerHTML = 'Tech<span>Store</span>';
            // se nome for diferente mas contém techstore, adapta
            if (cfg.nome !== 'TechStore') {
                // tenta manter estilo: primeira palavra + span resto
                const partes = cfg.nome.split(' ');
                if (partes.length >= 2) el.innerHTML = partes[0] + '<span>' + partes.slice(1).join(' ') + '</span>';
                else el.textContent = cfg.nome;
            }
        } else {
            el.textContent = cfg.nome;
        }
    });
    const tag = document.querySelector('.banner__tag');
    if (tag && cfg.bannerTag) tag.textContent = cfg.bannerTag;
    const titulo = document.querySelector('.banner__text h1');
    if (titulo && cfg.bannerTitulo) {
        // preserva span no título se houver
        if (cfg.bannerTitulo.includes('impulsiona')) {
            titulo.innerHTML = 'Tech que <span>impulsiona</span> você';
        } else {
            titulo.textContent = cfg.bannerTitulo;
        }
        // fallback: usa texto puro se diferente
        if (cfg.bannerTitulo !== CONFIG_DEFAULT_FRONT.bannerTitulo) titulo.textContent = cfg.bannerTitulo;
    }
    const desc = document.querySelector('.banner__text p');
    if (desc && cfg.bannerDescricao) desc.textContent = cfg.bannerDescricao;
    // footer contato - tenta achar pelo último .footer__col
    const footerCols = document.querySelectorAll('.footer__col');
    if (footerCols.length) {
        const contatoCol = footerCols[footerCols.length - 1];
        const p = contatoCol ? contatoCol.querySelector('p') : null;
        if (p && (cfg.telefone || cfg.email)) {
            // mantém formato: email<br>telefone<br>horário
            const tel = cfg.telefone || CONFIG_DEFAULT_FRONT.telefone;
            const email = cfg.email || CONFIG_DEFAULT_FRONT.email;
            p.innerHTML = `${email}<br>${tel}<br>Seg a Sex 9h às 18h`;
        }
    }
    // título da página
    try {
        if (cfg.nome && document.title && document.title.includes('TechStore')) {
            document.title = document.title.replace('TechStore', cfg.nome);
        }
    } catch {}
}

function configurarSyncCatalogo() {
    window.addEventListener('storage', (e)=>{
        if (e.key === 'techstore_produtos_admin' || e.key === 'techstore_produtos') {
            if (recarregarProdutosDoAdmin()) {
                renderHome();
                const grid = document.getElementById('produtos-grid');
                if (grid) {
                    if (typeof configurarProdutosPage === 'function') {
                        const inp = document.getElementById('search-input');
                        if (inp) inp.dispatchEvent(new Event('input', {bubbles:true}));
                        else renderHome();
                    }
                }
                const detalhe = document.getElementById('produto-detalhe');
                if (detalhe) configurarProdutoPage();
                if (typeof mostrarToast === 'function') mostrarToast('Catálogo atualizado', 'success');
            }
        }
        if (e.key === 'techstore_config') {
            aplicarConfigNoFrontend();
            // recalcula frete se estiver no carrinho
            if (typeof atualizarFreteECarrinho === 'function') atualizarFreteECarrinho();
            else if (typeof renderCarrinho === 'function') renderCarrinho();
        }
    });
    window.addEventListener('produtos:atualizado', ()=>{
        if (recarregarProdutosDoAdmin()) {
            renderHome();
            configurarProdutoPage();
            const inp = document.getElementById('search-input');
            if (inp) inp.dispatchEvent(new Event('input', {bubbles:true}));
        }
    });
    window.addEventListener('config:atualizado', ()=>{
        aplicarConfigNoFrontend();
        if (typeof atualizarFreteECarrinho === 'function') atualizarFreteECarrinho();
        else if (typeof renderCarrinho === 'function') renderCarrinho();
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    recarregarProdutosDoAdmin();
    aplicarConfigNoFrontend();
    atualizarContadorCarrinho();
    configurarUI();
    atualizarHeaderAuth();
    configurarSyncCatalogo();
    renderHome();
    configurarProdutosPage();
    configurarProdutoPage();
    configurarBusca();
});
