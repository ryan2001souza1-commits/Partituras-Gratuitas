// TechStore Admin - admin.js | ETAPA 2 + 3
// Dashboard, menu e gerenciamento de produtos
// Reutiliza produtos.js; persiste em localStorage techstore_produtos_admin

(function proteger(){
    if (typeof isAdmin === 'function' && !isAdmin()) {
        const inAdmin = window.location.pathname.includes('/admin');
        window.location.href = inAdmin ? '../login.html' : 'login.html';
    }
})();

const PEDIDOS_KEY = 'techstore_pedidos';
const PRODUTOS_ADMIN_KEY = 'techstore_produtos_admin';
const CONFIG_KEY = 'techstore_config';

function getProdutosAdmin() {
    try {
        const raw = localStorage.getItem(PRODUTOS_ADMIN_KEY);
        if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr) && arr.length) return arr;
        }
        const raw2 = localStorage.getItem('techstore_produtos');
        if (raw2) {
            const arr2 = JSON.parse(raw2);
            if (Array.isArray(arr2) && arr2.length) return arr2;
        }
    } catch {}
    try { if (typeof produtos !== 'undefined' && Array.isArray(produtos)) return produtos; } catch {}
    try { if (typeof window !== 'undefined' && window.produtos && Array.isArray(window.produtos)) return window.produtos; } catch {}
    try { if (typeof globalThis !== 'undefined' && globalThis.produtos && Array.isArray(globalThis.produtos)) return globalThis.produtos; } catch {}
    return [];
}

function salvarProdutosAdmin(arr) {
    // evita mutação cruzada quando arr é a própria referência de window.produtos
    const snapshot = Array.isArray(arr) ? [...arr] : [];
    try { localStorage.setItem(PRODUTOS_ADMIN_KEY, JSON.stringify(snapshot)); } catch {}
    try {
        if (typeof produtos !== 'undefined' && Array.isArray(produtos)) {
            produtos.length = 0;
            snapshot.forEach(p => produtos.push(p));
        }
        if (typeof window !== 'undefined' && window.produtos && Array.isArray(window.produtos)) {
            // se já sincronizado via produtos acima, evita duplicar
            if (typeof produtos === 'undefined' || window.produtos !== produtos) {
                window.produtos.length = 0;
                snapshot.forEach(p => window.produtos.push(p));
            }
        }
        if (typeof globalThis !== 'undefined' && globalThis.produtos && Array.isArray(globalThis.produtos) && globalThis.produtos !== snapshot) {
            try {
                if (typeof produtos === 'undefined' || globalThis.produtos !== produtos) {
                    if (typeof window === 'undefined' || globalThis.produtos !== window.produtos) {
                        globalThis.produtos.length = 0;
                        snapshot.forEach(p => globalThis.produtos.push(p));
                    }
                }
            } catch {}
        }
    } catch {}
    try { window.dispatchEvent(new CustomEvent('produtos:atualizado', { detail: { total: snapshot.length } })); } catch {}
}

function getEstoque(produto) {
    if (typeof produto.estoque === 'number') return produto.estoque;
    const id = Number(produto.id) || 0;
    if (id % 7 === 0) return 0;
    if (id % 5 === 0) return 4;
    if (id % 3 === 0) return 8;
    return 22;
}

function getStatusEstoque(produto) {
    const e = getEstoque(produto);
    if (e === 0) return { label: 'Sem estoque', cls: 'admin-badge--estoque-zero' };
    if (e <= 10) return { label: `Estoque baixo (${e})`, cls: 'admin-badge--estoque-baixo' };
    return { label: `Em estoque (${e})`, cls: 'admin-badge--estoque-ok' };
}

function getPedidosAdmin() {
    try {
        const raw = localStorage.getItem(PEDIDOS_KEY);
        if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr) && arr.length) return arr;
        }
    } catch {}
    const seed = [
        { id: 1001, cliente: 'João Silva', data: '2026-05-10', valor: 899.90, status: 'Pago' },
        { id: 1002, cliente: 'Maria Souza', data: '2026-05-09', valor: 5499.00, status: 'Em preparação' },
        { id: 1003, cliente: 'Ana Lima', data: '2026-05-08', valor: 299.00, status: 'Enviado' },
        { id: 1004, cliente: 'Carlos Mendes', data: '2026-05-07', valor: 1299.00, status: 'Entregue' },
        { id: 1005, cliente: 'Fernanda Alves', data: '2026-05-06', valor: 189.00, status: 'Aguardando pagamento' },
        { id: 1006, cliente: 'Ricardo Rocha', data: '2026-05-05', valor: 2399.00, status: 'Pago' },
        { id: 1007, cliente: 'Patricia Dias', data: '2026-05-04', valor: 499.00, status: 'Cancelado' },
        { id: 1008, cliente: 'Lucas Martins', data: '2026-05-03', valor: 699.00, status: 'Pago' },
        { id: 1009, cliente: 'Juliana Costa', data: '2026-05-02', valor: 2299.00, status: 'Enviado' },
        { id: 1010, cliente: 'Roberto Nunes', data: '2026-05-01', valor: 199.00, status: 'Pago' },
        { id: 1011, cliente: 'Sandra Reis', data: '2026-04-30', valor: 999.00, status: 'Em preparação' },
        { id: 1012, cliente: 'Thiago Pereira', data: '2026-04-29', valor: 7499.00, status: 'Pago' },
    ];
    try { localStorage.setItem(PEDIDOS_KEY, JSON.stringify(seed)); } catch {}
    return seed;
}

function formatarPrecoAdmin(v) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function renderDashboard() {
    const grid = document.getElementById('admin-cards');
    if (!grid) return;
    const produtos = getProdutosAdmin();
    const pedidos = getPedidosAdmin();
    const totalProdutos = produtos.length;
    const totalPedidos = pedidos.length;
    const vendas = pedidos.filter(p => !['Cancelado','Aguardando pagamento'].includes(p.status)).reduce((s,p)=> s + (Number(p.valor)||0), 0);
    const estoqueBaixo = produtos.filter(p => { const e = getEstoque(p); return e > 0 && e <= 10; }).length;
    const semEstoque = produtos.filter(p => getEstoque(p) === 0).length;
    const elProdutos = document.getElementById('dash-produtos');
    const elPedidos = document.getElementById('dash-pedidos');
    const elVendas = document.getElementById('dash-vendas');
    const elEstoque = document.getElementById('dash-estoque');
    if (elProdutos) elProdutos.textContent = totalProdutos;
    if (elPedidos) elPedidos.textContent = totalPedidos;
    if (elVendas) elVendas.textContent = formatarPrecoAdmin(vendas || 4890);
    if (elEstoque) elEstoque.textContent = estoqueBaixo;
    const hint = document.getElementById('dash-estoque-hint');
    if (hint) hint.textContent = semEstoque ? `${semEstoque} sem estoque • ${estoqueBaixo} baixo` : `${estoqueBaixo} com estoque 1-10`;
    const tbody = document.getElementById('dash-pedidos-tbody');
    if (tbody) {
        tbody.innerHTML = pedidos.slice(0,5).map(p => `
            <tr>
                <td>#${p.id}</td>
                <td>${p.cliente}</td>
                <td>${p.data}</td>
                <td>${formatarPrecoAdmin(p.valor)}</td>
                <td><span class="admin-badge-status admin-badge-status--${p.status.toLowerCase().replace(/[^a-z]/g,'')}">${p.status}</span></td>
            </tr>
        `).join('');
    }
}

// ---------- Produtos (ETAPA 3) ----------

let _produtosFiltro = '';
let _produtoExcluirId = null;

function gerarNovoId() {
    const arr = getProdutosAdmin();
    const max = arr.reduce((m,p)=> Math.max(m, Number(p.id)||0), 0);
    return max + 1;
}

function calcularDesconto(preco, precoAntigo) {
    const p = Number(preco)||0;
    const pa = Number(precoAntigo)||0;
    if (!pa || pa <= p) return 0;
    return Math.round((1 - p/pa)*100);
}

function renderProdutosTabela() {
    const tbody = document.getElementById('produtos-tbody');
    const countEl = document.getElementById('prod-count');
    const statsEl = document.getElementById('prod-stats');
    if (!tbody) return;
    let lista = getProdutosAdmin();
    // filtro
    const termo = (_produtosFiltro || '').toLowerCase();
    if (termo) {
        lista = lista.filter(p => p.nome.toLowerCase().includes(termo) || p.categoria.toLowerCase().includes(termo));
    }
    if (countEl) countEl.textContent = getProdutosAdmin().length;
    if (statsEl) {
        const ativos = lista.filter(p=> p.ativo !== false).length;
        statsEl.textContent = `${lista.length} exibidos • ${ativos} ativos`;
    }
    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted)">Nenhum produto encontrado.</td></tr>`;
        return;
    }
    tbody.innerHTML = lista.map(p => {
        const est = getStatusEstoque(p);
        const ativo = p.ativo !== false;
        return `
            <tr>
                <td><img src="${p.imagem || ''}" alt="" class="admin-prod-img" onerror="this.style.display='none'"></td>
                <td><div class="admin-prod-name" title="${p.nome}">${p.nome}</div></td>
                <td><span class="admin-prod-cat">${p.categoria}</span></td>
                <td><strong>${formatarPrecoAdmin(p.preco)}</strong>${p.desconto ? `<br><span style="font-size:.75rem; color:var(--danger); font-weight:700">-${p.desconto}%</span>` : ''}</td>
                <td><span class="admin-badge ${est.cls}">${est.label}</span></td>
                <td><span class="admin-badge ${ativo ? 'admin-badge--ativo' : 'admin-badge--inativo'}">${ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td>
                    <div class="admin-actions">
                        <button class="btn btn--ghost" onclick="editarProduto(${p.id})">Editar</button>
                        <button class="btn btn--ghost" onclick="toggleAtivoProduto(${p.id})">${ativo ? 'Desativar' : 'Ativar'}</button>
                        <button class="btn btn--ghost" style="color:var(--danger); border-color:#fecaca" onclick="confirmarExcluirProduto(${p.id})">Excluir</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function abrirModalProduto(produto) {
    const modal = document.getElementById('produto-modal');
    const title = document.getElementById('produto-modal-title');
    if (!modal) return;
    const isEdit = !!produto;
    if (title) title.textContent = isEdit ? 'Editar produto' : 'Adicionar produto';
    document.getElementById('prod-id').value = produto ? produto.id : '';
    document.getElementById('prod-nome').value = produto ? produto.nome : '';
    document.getElementById('prod-categoria').value = produto ? produto.categoria : '';
    document.getElementById('prod-preco').value = produto ? produto.preco : '';
    document.getElementById('prod-preco-antigo').value = produto ? (produto.precoAntigo || '') : '';
    document.getElementById('prod-desconto').value = produto ? (produto.desconto || '') : '';
    document.getElementById('prod-estoque').value = produto ? getEstoque(produto) : '15';
    document.getElementById('prod-imagem').value = produto ? (produto.imagem || '') : '';
    document.getElementById('prod-descricao').value = produto ? (produto.descricao || '') : '';
    document.getElementById('prod-especs').value = produto ? (produto.especificacoes || []).join('\n') : '';
    document.getElementById('prod-ativo').checked = produto ? produto.ativo !== false : true;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    setTimeout(()=> document.getElementById('prod-nome')?.focus(), 60);
}

function fecharModalProduto() {
    const modal = document.getElementById('produto-modal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
}

function editarProduto(id) {
    const p = getProdutosAdmin().find(x=> Number(x.id)===Number(id));
    if (!p) return;
    abrirModalProduto(p);
}

function confirmarExcluirProduto(id) {
    _produtoExcluirId = id;
    const p = getProdutosAdmin().find(x=> Number(x.id)===Number(id));
    const nomeEl = document.getElementById('confirm-nome');
    if (nomeEl) nomeEl.textContent = p ? p.nome : '';
    const modal = document.getElementById('confirm-modal');
    if (modal) { modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
}

function fecharConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    if (modal) { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
    _produtoExcluirId = null;
}

function excluirProdutoConfirmado() {
    if (_produtoExcluirId == null) return;
    let arr = getProdutosAdmin();
    arr = arr.filter(p=> Number(p.id) !== Number(_produtoExcluirId));
    salvarProdutosAdmin(arr);
    fecharConfirmModal();
    renderProdutosTabela();
    renderDashboard();
    if (typeof mostrarToast === 'function') mostrarToast('Produto excluído', 'success');
    else if (window.mostrarToast) window.mostrarToast('Produto excluído','success');
}

function toggleAtivoProduto(id) {
    const arr = getProdutosAdmin();
    const idx = arr.findIndex(p=> Number(p.id)===Number(id));
    if (idx===-1) return;
    arr[idx].ativo = !(arr[idx].ativo !== false);
    salvarProdutosAdmin(arr);
    renderProdutosTabela();
    renderDashboard();
}

function configurarProdutosAdmin() {
    const tbodyExists = document.getElementById('produtos-tbody');
    if (!tbodyExists) return;

    // busca
    const busca = document.getElementById('prod-busca');
    if (busca) {
        busca.addEventListener('input', ()=>{
            _produtosFiltro = busca.value.trim();
            renderProdutosTabela();
        });
    }
    // adicionar
    document.getElementById('btn-add-produto')?.addEventListener('click', ()=> abrirModalProduto(null));
    // modal fechar
    document.getElementById('produto-close')?.addEventListener('click', fecharModalProduto);
    document.getElementById('produto-cancel')?.addEventListener('click', fecharModalProduto);
    document.getElementById('produto-overlay')?.addEventListener('click', fecharModalProduto);
    document.getElementById('confirm-cancel')?.addEventListener('click', fecharConfirmModal);
    document.getElementById('confirm-overlay')?.addEventListener('click', fecharConfirmModal);
    document.getElementById('confirm-excluir')?.addEventListener('click', excluirProdutoConfirmado);
    document.addEventListener('keydown', (e)=>{
        if(e.key==='Escape'){
            fecharModalProduto();
            fecharConfirmModal();
        }
    });
    // desconto auto
    const precoEl = document.getElementById('prod-preco');
    const antigoEl = document.getElementById('prod-preco-antigo');
    const descEl = document.getElementById('prod-desconto');
    function atualizaDesconto(){
        const d = calcularDesconto(precoEl.value, antigoEl.value);
        if (descEl && (antigoEl.value || precoEl.value)) descEl.placeholder = d ? d : '0';
    }
    precoEl?.addEventListener('input', atualizaDesconto);
    antigoEl?.addEventListener('input', atualizaDesconto);

    // submit
    const form = document.getElementById('produto-form');
    if (form) {
        form.addEventListener('submit', (e)=>{
            e.preventDefault();
            const idVal = document.getElementById('prod-id').value;
            const nome = document.getElementById('prod-nome').value.trim();
            const categoria = document.getElementById('prod-categoria').value;
            const preco = parseFloat(document.getElementById('prod-preco').value);
            const precoAntigo = parseFloat(document.getElementById('prod-preco-antigo').value) || preco;
            const descontoInput = parseInt(document.getElementById('prod-desconto').value,10);
            const estoque = parseInt(document.getElementById('prod-estoque').value,10);
            const imagem = document.getElementById('prod-imagem').value.trim();
            const descricao = document.getElementById('prod-descricao').value.trim();
            const especsRaw = document.getElementById('prod-especs').value.trim();
            const ativo = document.getElementById('prod-ativo').checked;

            if (!nome) { alert('Informe o nome'); return; }
            if (!categoria) { alert('Selecione a categoria'); return; }
            if (!(preco>=0)) { alert('Preço inválido'); return; }
            if (!(estoque>=0)) { alert('Estoque inválido'); return; }

            const desconto = Number.isFinite(descontoInput) ? descontoInput : calcularDesconto(preco, precoAntigo);
            const especs = especsRaw ? especsRaw.split('\n').map(s=> s.trim()).filter(Boolean) : [];

            let arr = getProdutosAdmin();
            if (idVal) {
                const idx = arr.findIndex(p=> String(p.id)===String(idVal));
                if (idx===-1) { alert('Produto não encontrado'); return; }
                arr[idx] = { ...arr[idx], nome, categoria, preco, precoAntigo, desconto, estoque, imagem: imagem || arr[idx].imagem, descricao, especificacoes: especs, ativo };
            } else {
                const novo = {
                    id: gerarNovoId(),
                    nome, categoria, preco, precoAntigo: precoAntigo || preco, desconto, estoque, imagem: imagem || `https://placehold.co/400x300/0f172a/ffffff?text=${encodeURIComponent(nome.slice(0,20))}`,
                    descricao: descricao || `Produto ${nome} - TechStore`,
                    especificacoes: especs.length ? especs : ['Garantia: 12 meses'],
                    ativo
                };
                arr.push(novo);
            }
            salvarProdutosAdmin(arr);
            fecharModalProduto();
            renderProdutosTabela();
            renderDashboard();
            const msg = idVal ? 'Produto atualizado' : 'Produto adicionado';
            if (typeof mostrarToast === 'function') mostrarToast(msg,'success');
        });
    }

    renderProdutosTabela();
}

// ---------- Pedidos (ETAPA 5) ----------
let _pedidosBusca = '';
let _pedidosFiltroStatus = '';

function salvarPedidosAdmin(arr) {
    try { localStorage.setItem(PEDIDOS_KEY, JSON.stringify(arr)); } catch {}
    try { window.dispatchEvent(new CustomEvent('pedidos:atualizado')); } catch {}
}

function renderPedidosTabela() {
    const tbody = document.getElementById('pedidos-tbody');
    const countEl = document.getElementById('pedidos-count');
    const valorEl = document.getElementById('pedidos-valor');
    if (!tbody) return;
    let lista = getPedidosAdmin();
    const termo = (_pedidosBusca || '').toLowerCase();
    const filtro = _pedidosFiltroStatus || '';
    if (termo) {
        lista = lista.filter(p => String(p.id).includes(termo) || p.cliente.toLowerCase().includes(termo));
    }
    if (filtro) {
        lista = lista.filter(p => p.status === filtro);
    }
    if (countEl) countEl.textContent = lista.length;
    if (valorEl) {
        const total = lista.reduce((s,p)=> s + Number(p.valor||0), 0);
        valorEl.textContent = formatarPrecoAdmin(total);
    }
    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted)">Nenhum pedido encontrado.</td></tr>`;
        return;
    }
    const statusOptions = ['Aguardando pagamento','Pago','Em preparação','Enviado','Entregue','Cancelado'];
    tbody.innerHTML = lista.map(p => `
        <tr>
            <td><strong>#${p.id}</strong></td>
            <td>${p.cliente}</td>
            <td>${p.data}</td>
            <td>${formatarPrecoAdmin(p.valor)}</td>
            <td><span class="admin-badge-status admin-badge-status--${p.status.toLowerCase().replace(/[^a-z]/g,'')}">${p.status}</span></td>
            <td>
                <select class="admin-select-status" data-id="${p.id}" aria-label="Alterar status do pedido #${p.id}">
                    ${statusOptions.map(s=> `<option value="${s}" ${s===p.status?'selected':''}>${s}</option>`).join('')}
                </select>
            </td>
        </tr>
    `).join('');
    // bind change
    tbody.querySelectorAll('.admin-select-status').forEach(sel=>{
        sel.addEventListener('change', (e)=>{
            const id = Number(e.target.getAttribute('data-id'));
            const novo = e.target.value;
            const arr = getPedidosAdmin();
            const idx = arr.findIndex(x=> Number(x.id)===id);
            if (idx!==-1) {
                arr[idx].status = novo;
                salvarPedidosAdmin(arr);
                renderPedidosTabela();
                renderDashboard();
                if (typeof mostrarToast === 'function') mostrarToast(`Pedido #${id} → ${novo}`, 'success');
            }
        });
    });
}

function configurarPedidosAdmin() {
    if (!document.getElementById('pedidos-tbody')) return;
    const busca = document.getElementById('pedidos-busca');
    const filtro = document.getElementById('pedidos-filtro-status');
    if (busca) busca.addEventListener('input', ()=>{ _pedidosBusca = busca.value.trim(); renderPedidosTabela(); });
    if (filtro) filtro.addEventListener('change', ()=>{ _pedidosFiltroStatus = filtro.value; renderPedidosTabela(); });
    renderPedidosTabela();
}

// ---------- Configurações (ETAPA 6) ----------
const CONFIG_DEFAULT = {
    nome: 'TechStore',
    telefone: '(11) 99999-0000',
    email: 'contato@techstore.com.br',
    fretePadrao: 19.90,
    bannerTag: 'Ofertas da semana',
    bannerTitulo: 'Tech que impulsiona você',
    bannerDescricao: 'Até 40% OFF em notebooks, placas de vídeo e smartphones. Frete grátis para todo o Brasil.'
};

function getConfig() {
    try {
        const raw = localStorage.getItem(CONFIG_KEY);
        if (raw) {
            const obj = JSON.parse(raw);
            return { ...CONFIG_DEFAULT, ...obj };
        }
    } catch {}
    return { ...CONFIG_DEFAULT };
}

function salvarConfig(cfg) {
    const merged = { ...CONFIG_DEFAULT, ...cfg };
    // normaliza frete
    const f = parseFloat(merged.fretePadrao);
    merged.fretePadrao = Number.isFinite(f) && f >= 0 ? Math.round(f*100)/100 : CONFIG_DEFAULT.fretePadrao;
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify(merged)); } catch {}
    try { window.dispatchEvent(new CustomEvent('config:atualizado', { detail: merged })); } catch {}
    return merged;
}

function configurarConfiguracoes() {
    const form = document.getElementById('config-form');
    if (!form) return;
    const cfg = getConfig();
    const setVal = (id, v)=>{ const el=document.getElementById(id); if(el) el.value=v; };
    setVal('cfg-nome', cfg.nome);
    setVal('cfg-telefone', cfg.telefone);
    setVal('cfg-email', cfg.email);
    setVal('cfg-frete', cfg.fretePadrao);
    setVal('cfg-banner-tag', cfg.bannerTag);
    setVal('cfg-banner-titulo', cfg.bannerTitulo);
    setVal('cfg-banner-desc', cfg.bannerDescricao);

    form.addEventListener('submit', (e)=>{
        e.preventDefault();
        const novo = {
            nome: document.getElementById('cfg-nome').value.trim() || CONFIG_DEFAULT.nome,
            telefone: document.getElementById('cfg-telefone').value.trim(),
            email: document.getElementById('cfg-email').value.trim(),
            fretePadrao: document.getElementById('cfg-frete').value,
            bannerTag: document.getElementById('cfg-banner-tag').value.trim(),
            bannerTitulo: document.getElementById('cfg-banner-titulo').value.trim(),
            bannerDescricao: document.getElementById('cfg-banner-desc').value.trim()
        };
        if (!novo.nome) { alert('Informe o nome da loja'); return; }
        salvarConfig(novo);
        if (typeof mostrarToast === 'function') mostrarToast('Configurações salvas', 'success');
        // atualiza dashboard se precisar
        renderDashboard();
    });

    document.getElementById('config-reset')?.addEventListener('click', ()=>{
        if (!confirm('Restaurar configurações padrão?')) return;
        try { localStorage.removeItem(CONFIG_KEY); } catch {}
        const def = getConfig();
        setVal('cfg-nome', def.nome);
        setVal('cfg-telefone', def.telefone);
        setVal('cfg-email', def.email);
        setVal('cfg-frete', def.fretePadrao);
        setVal('cfg-banner-tag', def.bannerTag);
        setVal('cfg-banner-titulo', def.bannerTitulo);
        setVal('cfg-banner-desc', def.bannerDescricao);
        if (typeof mostrarToast === 'function') mostrarToast('Configurações restauradas', 'success');
    });
}

// Menu mobile
function configurarAdminMenu() {
    const btn = document.getElementById('admin-menu-btn');
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('admin-overlay');
    if (!btn || !sidebar) return;
    function toggle(open) {
        const isOpen = typeof open === 'boolean' ? open : !sidebar.classList.contains('open');
        sidebar.classList.toggle('open', isOpen);
        btn.classList.toggle('open', isOpen);
        if (overlay) overlay.classList.toggle('show', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }
    btn.addEventListener('click', () => toggle());
    if (overlay) overlay.addEventListener('click', () => toggle(false));
    sidebar.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        if (window.innerWidth <= 860) toggle(false);
    }));
    document.addEventListener('keydown', (e)=> { if(e.key==='Escape') toggle(false); });
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    if (typeof protegerPaginaAdmin === 'function') protegerPaginaAdmin();
    try {
        const u = (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
        const nomeEl = document.getElementById('admin-user-nome');
        const emailEl = document.getElementById('admin-user-email');
        if (u) {
            if (nomeEl) nomeEl.textContent = u.nome || 'Administrador';
            if (emailEl) emailEl.textContent = u.email || '';
        }
    } catch {}
    configurarAdminMenu();
    renderDashboard();
    configurarProdutosAdmin();
    configurarPedidosAdmin();
    configurarConfiguracoes();
    document.getElementById('admin-logout')?.addEventListener('click', ()=> {
        if (typeof logout === 'function') logout();
        window.location.href = '../login.html';
    });
    document.getElementById('admin-logout-mobile')?.addEventListener('click', ()=>{
        if (typeof logout === 'function') logout();
        window.location.href = '../login.html';
    });
    window.addEventListener('focus', renderDashboard);
    window.addEventListener('storage', (e)=>{
        if (e.key === PRODUTOS_ADMIN_KEY || e.key === 'techstore_produtos' || e.key === PEDIDOS_KEY) { renderDashboard(); renderProdutosTabela(); renderPedidosTabela(); }
    });
    window.addEventListener('produtos:atualizado', ()=> { renderDashboard(); renderProdutosTabela(); });
    window.addEventListener('pedidos:atualizado', ()=> { renderDashboard(); renderPedidosTabela(); });
});

// Expor para testes e inline handlers
window.getProdutosAdmin = getProdutosAdmin;
window.salvarProdutosAdmin = salvarProdutosAdmin;
window.renderProdutosTabela = renderProdutosTabela;
window.editarProduto = editarProduto;
window.confirmarExcluirProduto = confirmarExcluirProduto;
window.toggleAtivoProduto = toggleAtivoProduto;
window.getPedidosAdmin = getPedidosAdmin;
window.salvarPedidosAdmin = salvarPedidosAdmin;
window.renderPedidosTabela = renderPedidosTabela;
window.getConfig = getConfig;
window.salvarConfig = salvarConfig;
