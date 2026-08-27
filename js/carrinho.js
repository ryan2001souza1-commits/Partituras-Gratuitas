// TechStore - carrinho.js | ETAPA 6
// Lógica do carrinho: listar, alterar quantidade, remover, cálculos, finalizar

function renderCarrinho() {
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

    // Enriquecer com dados atuais do catálogo (preço pode ter mudado, mas mantemos salvo)
    // Calcula totais
    const subtotal = carrinho.reduce((s, item) => s + item.preco * item.quantidade, 0);
    const frete = subtotal >= 500 ? 0 : 29.90;
    const total = subtotal + frete;

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

    const resumoHTML = `
        <div class="carrinho-lista">
            ${listaHTML}
        </div>
        <aside class="carrinho-resumo">
            <h3>Resumo do pedido</h3>
            <div class="resumo-linha"><span>Subtotal</span><span>${formatarPreco(subtotal)}</span></div>
            <div class="resumo-linha"><span>Frete</span><span>${frete === 0 ? '<span class=\"frete-gratis\">Grátis</span>' : formatarPreco(frete)}</span></div>
            ${frete === 0 ? '<p style="font-size:.8rem; color:var(--success); margin:6px 0">✔ Frete grátis para compras acima de R$ 500</p>' : '<p style="font-size:.8rem; color:var(--text-muted); margin:6px 0">Faltam ' + formatarPreco(500 - subtotal) + ' para frete grátis</p>'}
            <div class="resumo-linha total"><span>Total</span><span>${formatarPreco(total)}</span></div>
            <p style="font-size:.85rem; color:var(--text-muted); margin-top:8px">em até 12x de <strong>${formatarPreco(total/12)}</strong> sem juros</p>
            <button class="btn btn--primary checkout-btn" onclick="finalizarCompra()">Finalizar compra</button>
            <a href="produtos.html" class="btn btn--ghost" style="width:100%; margin-top:10px; justify-content:center">Continuar comprando</a>
        </aside>
    `;

    container.innerHTML = resumoHTML;
}

function alterarQuantidade(id, delta) {
    const carrinho = getCarrinho();
    const item = carrinho.find(i => i.id === id);
    if (!item) return;
    item.quantidade += delta;
    if (item.quantidade <= 0) {
        // remove
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
    const total = carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0);
    const frete = total >= 500 ? 0 : 29.90;
    const totalComFrete = total + frete;

    // Simula finalização
    mostrarToast(`Compra finalizada! Total ${formatarPreco(totalComFrete)} — Obrigado!`, 'success');
    localStorage.removeItem(CART_KEY);
    atualizarContadorCarrinho();
    setTimeout(() => renderCarrinho(), 500);
}

// Inicializa quando DOM pronto (app.js já carregou)
document.addEventListener('DOMContentLoaded', () => {
    // só executa se estiver na página carrinho
    if (document.getElementById('carrinho-container')) {
        renderCarrinho();
    }
});
