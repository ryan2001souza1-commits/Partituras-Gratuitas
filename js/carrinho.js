// TechStore - carrinho.js | ETAPA 6 + CEP/Frete (ETAPA 3/4)
// Lógica do carrinho: listar, alterar quantidade, remover, cálculos, finalizar
// Integração CEP: calcularFrete(cep, produtos) DEMONSTRATIVO (ver js/cep.js)

let _freteCache = { valor: 0, prazo: '', nome: '', gratuito: false, loading: false };
let _freteTimer = null;

async function atualizarFreteECarrinho() {
    const cep = (typeof obterCEP === 'function' ? obterCEP() : null);
    const carrinho = getCarrinho();
    if (carrinho.length === 0) { _freteCache = { valor: 0, prazo: '', nome: '', gratuito: false, loading: false }; return; }
    if (!cep || (typeof validarCEP === 'function' && !validarCEP(cep))) {
        // sem CEP: frete padrão demonstrativo sem CEP (mantém lógica antiga base)
        const subtotal = carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0);
        _freteCache = { valor: subtotal >= 500 ? 0 : 29.90, prazo: subtotal >= 500 ? '3 a 6 dias úteis' : '3 a 6 dias úteis', nome: 'Frete padrão', gratuito: subtotal >= 500, loading: false };
        return;
    }
    _freteCache.loading = true;
    renderCarrinhoSync(); // mostra "Calculando frete..."
    try {
        const fn = (typeof calcularFrete === 'function') ? calcularFrete : (typeof window.calcularFrete === 'function' ? window.calcularFrete : null);
        if (fn) {
            const res = await fn(cep, carrinho);
            _freteCache = { valor: res.valor, prazo: res.prazo, nome: res.nome || 'Frete padrão', gratuito: !!res.gratuito, loading: false };
        } else {
            const subtotal = carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0);
            _freteCache = { valor: subtotal >= 500 ? 0 : 19.90, prazo: '3 a 6 dias úteis', nome: 'Frete padrão', gratuito: subtotal >= 500, loading: false };
        }
    } catch {
        _freteCache.loading = false;
        _freteCache.valor = 19.90;
    }
    renderCarrinhoSync();
}

function getFreteSync() {
    return _freteCache;
}

function criarEntregaHTML() {
    const cep = (typeof obterCEP === 'function' ? obterCEP() : null);
    const temCEP = cep && (typeof validarCEP === 'function' ? validarCEP(cep) : true);
    const end = (typeof obterEndereco === 'function' ? obterEndereco() : null);
    const cidadeEstado = end && end.cidade ? `${end.cidade} - ${end.estado}` : '';
    const frete = getFreteSync();

    if (!temCEP) {
        return `
            <div class="entrega-box">
                <div class="entrega-header">📦 Entrega</div>
                <p class="entrega-cep-vazio">Informe seu CEP para calcular o frete.</p>
                <button type="button" class="btn btn--primary btn--sm" onclick="abrirModalCEP()" style="width:100%; margin-top:8px">Informar CEP</button>
            </div>
        `;
    }

    const enderecoLinha = cidadeEstado ? `<div class="entrega-endereco">✓ Entrega para ${end.logradouro ? end.logradouro + (end.bairro ? ', ' + end.bairro + ' — ' : ' — ') : ''}${cidadeEstado}</div>` : '';
    // se ainda não tem cidade mas CEP existe, mostra só CEP
    const freteLinha = frete.loading
        ? `<div class="entrega-frete"><span>Frete padrão</span><span class="entrega-loading">Calculando frete...</span></div>`
        : `<div class="entrega-frete"><span>${frete.nome || 'Frete padrão'}</span><span class="${frete.gratuito ? 'frete-gratis' : ''}">${frete.gratuito ? 'Grátis' : formatarPreco(frete.valor)}</span></div>`;
    const prazoLinha = frete.prazo ? `<div class="entrega-prazo">Prazo: ${frete.prazo}</div>` : '';

    return `
        <div class="entrega-box">
            <div class="entrega-header">📦 Entrega</div>
            <div class="entrega-cep-linha">
                <span>CEP: <strong>${cep}</strong></span>
                <button type="button" class="entrega-alterar" onclick="alterarCEP()">Alterar</button>
            </div>
            ${enderecoLinha}
            ${freteLinha}
            ${prazoLinha}
        </div>
    `;
}

function renderCarrinhoSync() {
    const container = document.getElementById('carrinho-container');
    if (!container) return;
    const carrinho = getCarrinho();
    if (carrinho.length === 0) {
        container.innerHTML = `
            <div class="carrinho-vazio" style="grid-column:1/-1">
                <div style="font-size:3rem">🛒</div>
                <h3 style="margin-top:12px">Seu carrinho está vazio</h3>
                <p>Adicione produtos para ver o resumo aqui.</p>
                <a href="produtos.html" class="btn btn--primary">Ver produtos</a>
            </div>
        `;
        return;
    }
    const subtotal = carrinho.reduce((s, item) => s + item.preco * item.quantidade, 0);
    const frete = getFreteSync();
    const freteValor = frete.loading ? null : frete.valor;
    const total = freteValor !== null ? subtotal + freteValor : subtotal;
    const listaHTML = carrinho.map(item => `
        <div class="carrinho-item">
            <img src="${item.imagem}" alt="${item.nome}" class="carrinho-item__img" onerror="this.style.display='none'">
            <div>
                <div class="carrinho-item__nome">${item.nome}</div>
                <div class="carrinho-item__preco">${formatarPreco(item.preco)} <span style="color:var(--text-muted); font-weight:400; font-size:.85rem">un.</span></div>
                <div style="font-size:.85rem; color:var(--text-muted)">Subtotal: <strong style="color:var(--text)">${formatarPreco(item.preco * item.quantidade)}</strong></div>
            </div>
            <div class="carrinho-item__acoes">
                <button class="qtd-btn" onclick="alterarQuantidade(${item.id}, -1)" aria-label="Diminuir">−</button>
                <span class="qtd-num">${item.quantidade}</span>
                <button class="qtd-btn" onclick="alterarQuantidade(${item.id}, 1)" aria-label="Aumentar">+</button>
                <button class="remove-btn" onclick="removerItem(${item.id})">Remover</button>
            </div>
        </div>
    `).join('');

    const entregaHTML = criarEntregaHTML();

    const freteResumo = frete.loading
        ? `<span class="entrega-loading">Calculando frete...</span>`
        : (frete.gratuito ? '<span class="frete-gratis">Grátis</span>' : formatarPreco(frete.valor));

    const resumoHTML = `
        <div class="carrinho-lista">
            ${listaHTML}
        </div>
        <aside class="carrinho-resumo">
            ${entregaHTML}
            <h3 style="margin-top:16px">Resumo do pedido</h3>
            <div class="resumo-linha"><span>Produtos</span><span>${formatarPreco(subtotal)}</span></div>
            <div class="resumo-linha"><span>Frete</span><span>${freteResumo}</span></div>
            ${frete.gratuito ? '<p style="font-size:.8rem; color:var(--success); margin:6px 0">✔ Frete grátis para compras acima de R$ 500</p>' : (frete.loading ? '' : '<p style="font-size:.8rem; color:var(--text-muted); margin:6px 0">Prazo: ' + (frete.prazo || '3 a 6 dias úteis') + '</p>')}
            <div class="resumo-linha total"><span>Total</span><span>${frete.loading ? '—' : formatarPreco(total)}</span></div>
            <p style="font-size:.85rem; color:var(--text-muted); margin-top:8px">em até 12x de <strong>${frete.loading ? '—' : formatarPreco(total/12)}</strong> sem juros</p>
            <button class="btn btn--primary checkout-btn" onclick="finalizarCompra()" ${frete.loading ? 'disabled' : ''}>Finalizar compra</button>
            <a href="produtos.html" class="btn btn--ghost" style="width:100%; margin-top:10px; justify-content:center">Continuar comprando</a>
        </aside>
    `;
    container.innerHTML = resumoHTML;
}

function renderCarrinho() {
    const container = document.getElementById('carrinho-container');
    if (!container) return;
    const carrinho = getCarrinho();
    if (carrinho.length === 0) { renderCarrinhoSync(); return; }
    // se tem CEP, calcula frete async; senão render sync com frete padrão
    const cep = (typeof obterCEP === 'function' ? obterCEP() : null);
    if (cep && typeof validarCEP === 'function' && validarCEP(cep) && typeof calcularFrete === 'function') {
        // debounce leve para mudanças rápidas de qtd
        clearTimeout(_freteTimer);
        _freteTimer = setTimeout(() => { atualizarFreteECarrinho(); }, 150);
        // mostra estado atual imediatamente, depois atualiza
        renderCarrinhoSync();
        // se frete ainda não calculado ou loading, garante cálculo
        if (!_freteCache.loading && (_freteCache.valor === 0 && carrinho.reduce((s,i)=>s+i.preco*i.quantidade,0) < 500)) {
            atualizarFreteECarrinho();
        } else if (_freteCache.loading) {
            // já está calculando
        } else {
            // se frete já tem valor mas CEP mudou, recalcula
            const end = typeof obterEndereco === 'function' ? obterEndereco() : null;
            // força recalculo se ainda não tem prazo
            if (!_freteCache.prazo) atualizarFreteECarrinho();
        }
    } else {
        // sem CEP: usa regra padrão
        const subtotal = carrinho.reduce((s,i)=>s+i.preco*i.quantidade,0);
        _freteCache = { valor: subtotal >= 500 ? 0 : 29.90, prazo: '3 a 6 dias úteis', nome: 'Frete padrão', gratuito: subtotal >= 500, loading: false };
        renderCarrinhoSync();
    }
}

function alterarQuantidade(id, delta) {
    const carrinho = getCarrinho();
    const item = carrinho.find(i => i.id === id);
    if (!item) return;
    item.quantidade += delta;
    if (item.quantidade <= 0) {
        const idx = carrinho.indexOf(item);
        carrinho.splice(idx, 1);
        mostrarToast('Produto removido', 'error');
    }
    salvarCarrinho(carrinho);
    renderCarrinho();
}

function removerItem(id) {
    let carrinho = getCarrinho();
    carrinho = carrinho.filter(i => i.id !== id);
    salvarCarrinho(carrinho);
    mostrarToast('Produto removido do carrinho', 'error');
    renderCarrinho();
}

function finalizarCompra() {
    const carrinho = getCarrinho();
    if (carrinho.length === 0) {
        mostrarToast('Carrinho vazio', 'error');
        return;
    }
    const subtotal = carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0);
    const frete = getFreteSync();
    const freteValor = frete.loading ? 0 : frete.valor;
    const totalComFrete = subtotal + freteValor;
    mostrarToast(`Compra finalizada! Total ${formatarPreco(totalComFrete)} — Obrigado!`, 'success');
    localStorage.removeItem(CART_KEY);
    atualizarContadorCarrinho();
    setTimeout(() => renderCarrinho(), 500);
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('carrinho-container')) {
        renderCarrinho();
        // recalcula quando CEP mudar
        window.addEventListener('cep:alterado', () => { _freteCache.loading = true; atualizarFreteECarrinho(); });
        // também quando endereço for carregado
        window.addEventListener('storage', (e) => {
            if (e.key === 'cepEntrega' || e.key === 'cepEndereco') renderCarrinho();
        });
    }
});
