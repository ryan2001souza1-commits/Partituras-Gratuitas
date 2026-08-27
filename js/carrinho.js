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

function criarDadosPessoaisHTML(){
    const user = (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
    const nomeVal = user ? (user.nome||'') : '';
    const emailVal = user ? (user.email||'') : '';
    return `
        <div class="checkout-section">
            <h3>Dados pessoais</h3>
            <div class="checkout-field">
                <label for="checkout-nome">Nome completo *</label>
                <input type="text" id="checkout-nome" class="input" placeholder="Seu nome completo" value="${nomeVal.replace(/"/g,'&quot;')}">
                <span class="field-error" id="erro-checkout-nome"></span>
            </div>
            <div class="checkout-field">
                <label for="checkout-cpf">CPF *</label>
                <input type="text" id="checkout-cpf" class="input" placeholder="000.000.000-00" inputmode="numeric" maxlength="14">
                <span class="field-error" id="erro-checkout-cpf"></span>
            </div>
            <div class="checkout-field">
                <label for="checkout-email">E-mail *</label>
                <input type="email" id="checkout-email" class="input" placeholder="voce@exemplo.com" value="${emailVal.replace(/"/g,'&quot;')}">
                <span class="field-error" id="erro-checkout-email"></span>
            </div>
            <div class="checkout-field">
                <label for="checkout-telefone">Telefone *</label>
                <input type="tel" id="checkout-telefone" class="input" placeholder="(00) 00000-0000" inputmode="numeric" maxlength="15">
                <span class="field-error" id="erro-checkout-telefone"></span>
            </div>
        </div>
    `;
}

function criarEnderecoDetalhadoHTML(){
    const cep = (typeof obterCEP === 'function' ? obterCEP() : '') || '';
    const end = (typeof obterEndereco === 'function' ? obterEndereco() : null) || {};
    const rua = end.logradouro || '';
    const bairro = end.bairro || '';
    const cidade = end.cidade || '';
    const estado = end.estado || '';
    return `
        <div class="checkout-section">
            <h3>Endereço de entrega</h3>
            <div class="checkout-field">
                <label>CEP *</label>
                <div style="display:flex; gap:8px; align-items:center">
                    <input type="text" id="checkout-cep" class="input" value="${cep}" readonly style="flex:1; background:var(--background)">
                    <button type="button" class="btn btn--ghost btn--sm" onclick="alterarCEP()">Alterar</button>
                </div>
            </div>
            <div class="checkout-grid2">
                <div class="checkout-field" style="flex:2">
                    <label for="checkout-rua">Rua *</label>
                    <input type="text" id="checkout-rua" class="input" placeholder="Rua" value="${rua.replace(/"/g,'&quot;')}">
                    <span class="field-error" id="erro-checkout-rua"></span>
                </div>
                <div class="checkout-field" style="flex:0 0 110px">
                    <label for="checkout-numero">Número *</label>
                    <input type="text" id="checkout-numero" class="input" placeholder="123">
                    <span class="field-error" id="erro-checkout-numero"></span>
                </div>
            </div>
            <div class="checkout-field">
                <label for="checkout-complemento">Complemento</label>
                <input type="text" id="checkout-complemento" class="input" placeholder="Apto, bloco (opcional)">
            </div>
            <div class="checkout-field">
                <label for="checkout-bairro">Bairro *</label>
                <input type="text" id="checkout-bairro" class="input" placeholder="Bairro" value="${bairro.replace(/"/g,'&quot;')}">
                <span class="field-error" id="erro-checkout-bairro"></span>
            </div>
            <div class="checkout-grid2">
                <div class="checkout-field">
                    <label for="checkout-cidade">Cidade *</label>
                    <input type="text" id="checkout-cidade" class="input" placeholder="Cidade" value="${cidade.replace(/"/g,'&quot;')}">
                    <span class="field-error" id="erro-checkout-cidade"></span>
                </div>
                <div class="checkout-field" style="flex:0 0 110px">
                    <label for="checkout-estado">Estado *</label>
                    <input type="text" id="checkout-estado" class="input" placeholder="RJ" maxlength="2" value="${estado}">
                    <span class="field-error" id="erro-checkout-estado"></span>
                </div>
            </div>
        </div>
    `;
}

function aplicarMascarasCheckout(){
    const cpfEl=document.getElementById('checkout-cpf');
    const telEl=document.getElementById('checkout-telefone');
    if(cpfEl){
        cpfEl.addEventListener('input', ()=>{
            let v=cpfEl.value.replace(/\D/g,'').slice(0,11);
            if(v.length>9) v=v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4');
            else if(v.length>6) v=v.replace(/(\d{3})(\d{3})(\d+)/,'$1.$2.$3');
            else if(v.length>3) v=v.replace(/(\d{3})(\d+)/,'$1.$2');
            cpfEl.value=v;
        });
    }
    if(telEl){
        telEl.addEventListener('input', ()=>{
            let v=telEl.value.replace(/\D/g,'').slice(0,11);
            if(v.length>6) v=v.replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3');
            else if(v.length>2) v=v.replace(/(\d{2})(\d+)/,'($1) $2');
            else if(v.length>0) v=v.replace(/(\d*)/,'($1');
            telEl.value=v;
        });
    }
    const cepInput=document.getElementById('checkout-cep');
    const rua=document.getElementById('checkout-rua');
    const bairro=document.getElementById('checkout-bairro');
    const cidade=document.getElementById('checkout-cidade');
    const estado=document.getElementById('checkout-estado');
    function syncEndereco(){
        const end=(typeof obterEndereco==='function'? obterEndereco():null)||{};
        if(rua && !rua.value) rua.value=end.logradouro||'';
        if(bairro && !bairro.value) bairro.value=end.bairro||'';
        if(cidade && !cidade.value) cidade.value=end.cidade||'';
        if(estado && !estado.value) estado.value=end.estado||'';
        if(cepInput) cepInput.value=(typeof obterCEP==='function'? obterCEP():'')||'';
    }
    window.addEventListener('cep:alterado', syncEndereco);
    window.addEventListener('storage', (e)=>{ if(e.key==='cepEntrega'||e.key==='cepEndereco') syncEndereco(); });
}

// ---------- Pagamento (ETAPA 3) ----------
const JUROS_PARCELAMENTO = 0; // ex: 0.02 = 2% a.m. | 0 = sem juros

function detectarBandeira(numero){
    const n=(numero||'').replace(/\D/g,'');
    if(/^4/.test(n)) return 'Visa';
    if(/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'Mastercard';
    if(/^3[47]/.test(n)) return 'Amex';
    if(/^(4011|431274|438935|451416|457393|5067|5090|627760|636296|636368)/.test(n)) return 'Elo';
    if(n.length>=4) return 'Outro';
    return '';
}

function calcularParcelas(total){
    const max = total >= 300 ? 12 : total >= 100 ? 10 : 6;
    const parcelas=[];
    for(let i=1;i<=max;i++){
        let valor = total / i;
        if(JUROS_PARCELAMENTO>0 && i>6) valor = (total * Math.pow(1+JUROS_PARCELAMENTO, i)) / i;
        const semJuros = JUROS_PARCELAMENTO===0 || i<=6;
        parcelas.push({ n:i, valor: Math.round(valor*100)/100, semJuros });
    }
    return parcelas;
}

function criarPagamentoHTML(total){
    const parcelas=calcularParcelas(total);
    const opts=parcelas.map(p=>{
        const txt = p.n===1 ? `1x de ${formatarPreco(p.valor)} à vista` : `${p.n}x de ${formatarPreco(p.valor)}${p.semJuros?' sem juros':''}`;
        return `<option value="${p.n}">${txt}</option>`;
    }).join('');
    // tenta preservar seleção anterior
    const prevForma = (typeof localStorage!=='undefined' ? localStorage.getItem('checkout_forma') : null) || 'credito';
    const isCredito = prevForma !== 'pix';
    const isPix = prevForma === 'pix';
    return `
        <div class="checkout-section" id="checkout-pagamento">
            <h3>Forma de pagamento</h3>
            <div style="display:grid; gap:8px">
                <label class="checkout-radio ${isCredito?'checked':''}" style="display:flex; align-items:center; gap:8px; padding:10px 12px; border:1.5px solid ${isCredito?'var(--primary)':'var(--border)'}; border-radius:10px; cursor:pointer; background:${isCredito?'var(--primary-light)':'var(--surface)'}">
                    <input type="radio" name="forma-pagamento" value="credito" ${isCredito?'checked':''} style="accent-color:var(--primary)">
                    <span style="font-weight:700">Cartão de crédito</span>
                    <span style="margin-left:auto; font-size:.80rem; color:var(--text-muted)">até 12x</span>
                </label>
                <label class="checkout-radio ${prevForma==='debito'?'checked':''}" style="display:flex; align-items:center; gap:8px; padding:10px 12px; border:1.5px solid ${prevForma==='debito'?'var(--primary)':'var(--border)'}; border-radius:10px; cursor:pointer; background:${prevForma==='debito'?'var(--primary-light)':'var(--surface)'}">
                    <input type="radio" name="forma-pagamento" value="debito" ${prevForma==='debito'?'checked':''} style="accent-color:var(--primary)">
                    <span style="font-weight:700">Cartão de débito</span>
                    <span style="margin-left:auto; font-size:.80rem; color:var(--text-muted)">à vista</span>
                </label>
                <label class="checkout-radio ${isPix?'checked':''}" style="display:flex; align-items:center; gap:8px; padding:10px 12px; border:1.5px solid ${isPix?'var(--primary)':'var(--border)'}; border-radius:10px; cursor:pointer; background:${isPix?'var(--primary-light)':'var(--surface)'}">
                    <input type="radio" name="forma-pagamento" value="pix" ${isPix?'checked':''} style="accent-color:var(--primary)">
                    <span style="font-weight:700">PIX</span>
                    <span style="margin-left:auto; font-size:.80rem; color:var(--success); font-weight:700">instantâneo</span>
                </label>
            </div>

            <div id="checkout-cartao-campos" style="display:${isPix?'none':'grid'}; gap:10px; margin-top:10px">
                <div class="checkout-field">
                    <label for="checkout-cartao-numero">Número do cartão *</label>
                    <div style="position:relative">
                        <input type="text" id="checkout-cartao-numero" class="input" placeholder="0000 0000 0000 0000" inputmode="numeric" maxlength="19">
                        <span id="checkout-bandeira" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); font-size:.78rem; font-weight:800; color:var(--primary); background:var(--primary-light); padding:3px 8px; border-radius:999px; display:none"></span>
                    </div>
                    <span class="field-error" id="erro-checkout-cartao-numero"></span>
                </div>
                <div class="checkout-field">
                    <label for="checkout-cartao-nome">Nome impresso no cartão *</label>
                    <input type="text" id="checkout-cartao-nome" class="input" placeholder="Nome como no cartão">
                    <span class="field-error" id="erro-checkout-cartao-nome"></span>
                </div>
                <div class="checkout-grid2">
                    <div class="checkout-field">
                        <label for="checkout-cartao-validade">Validade *</label>
                        <input type="text" id="checkout-cartao-validade" class="input" placeholder="MM/AA" inputmode="numeric" maxlength="5">
                        <span class="field-error" id="erro-checkout-cartao-validade"></span>
                    </div>
                    <div class="checkout-field">
                        <label for="checkout-cartao-cvv">CVV *</label>
                        <div style="position:relative; display:flex; align-items:center">
                            <input type="password" id="checkout-cartao-cvv" class="input" placeholder="000" inputmode="numeric" maxlength="4" style="padding-right:42px">
                            <button type="button" id="checkout-cvv-toggle" aria-label="Mostrar CVV" style="position:absolute; right:6px; width:32px; height:32px; border:none; background:transparent; cursor:pointer; display:grid; place-items:center; color:var(--text-muted)">👁️</button>
                        </div>
                        <span class="field-error" id="erro-checkout-cartao-cvv"></span>
                    </div>
                </div>
                <div class="checkout-field" id="checkout-parcelas-wrap" style="display:${prevForma==='debito'?'none':'grid'}">
                    <label for="checkout-parcelas">Parcelamento *</label>
                    <select id="checkout-parcelas" class="input" style="cursor:pointer">
                        ${opts}
                    </select>
                </div>
            </div>

            <div id="checkout-pix-info" style="display:${isPix?'grid':'none'}; gap:8px; margin-top:10px; background:var(--background); border:1px solid var(--border); border-radius:10px; padding:12px">
                <div style="font-weight:700; display:flex; align-items:center; gap:8px"> <span style="background:#16a34a; color:#fff; width:28px; height:28px; border-radius:8px; display:grid; place-items:center">PIX</span> Pagamento via PIX</div>
                <p style="font-size:.88rem; color:var(--text-muted); line-height:1.5">Após confirmar o pedido, será gerado um pagamento PIX demonstrativo. Não será gerado QR Code real. Estrutura pronta para gateway (ex: Mercado Pago, Gerencianet).</p>
            </div>
        </div>
    `;
}

function aplicarMascarasPagamento(total){
    const numEl=document.getElementById('checkout-cartao-numero');
    const valEl=document.getElementById('checkout-cartao-validade');
    const cvvEl=document.getElementById('checkout-cartao-cvv');
    const bandeiraEl=document.getElementById('checkout-bandeira');
    const toggleBtn=document.getElementById('checkout-cvv-toggle');
    const parcelasWrap=document.getElementById('checkout-parcelas-wrap');
    const parcelasSel=document.getElementById('checkout-parcelas');
    const pixInfo=document.getElementById('checkout-pix-info');
    const cartaoCampos=document.getElementById('checkout-cartao-campos');

    function atualizarParcelas(){
        const t = (typeof total === 'number' ? total : 0);
        const novas=calcularParcelas(t);
        if(!parcelasSel) return;
        const cur=parcelasSel.value;
        parcelasSel.innerHTML=novas.map(p=>{
            const txt = p.n===1 ? `1x de ${formatarPreco(p.valor)} à vista` : `${p.n}x de ${formatarPreco(p.valor)}${p.semJuros?' sem juros':''}`;
            return `<option value="${p.n}">${txt}</option>`;
        }).join('');
        if(cur) parcelasSel.value=cur;
    }

    if(numEl){
        numEl.addEventListener('input', ()=>{
            let v=numEl.value.replace(/\D/g,'').slice(0,16);
            v=v.replace(/(\d{4})(?=\d)/g,'$1 ').trim();
            numEl.value=v;
            const bandeira=detectarBandeira(v);
            if(bandeiraEl){
                if(bandeira){ bandeiraEl.textContent=bandeira; bandeiraEl.style.display='block'; }
                else bandeiraEl.style.display='none';
            }
        });
    }
    if(valEl){
        valEl.addEventListener('input', ()=>{
            let v=valEl.value.replace(/\D/g,'').slice(0,4);
            if(v.length>2) v=v.replace(/(\d{2})(\d+)/,'$1/$2');
            valEl.value=v;
        });
    }
    if(cvvEl){
        cvvEl.addEventListener('input', ()=>{
            cvvEl.value=cvvEl.value.replace(/\D/g,'').slice(0,4);
        });
    }
    if(toggleBtn && cvvEl){
        toggleBtn.addEventListener('click', ()=>{
            const isPass=cvvEl.type==='password';
            cvvEl.type=isPass?'text':'password';
            toggleBtn.textContent=isPass?'🙈':'👁️';
        });
    }

    // radios
    document.querySelectorAll('input[name="forma-pagamento"]').forEach(r=>{
        r.addEventListener('change', (e)=>{
            const val=e.target.value;
            try{ localStorage.setItem('checkout_forma', val); }catch{}
            const isPix = val==='pix';
            const isDebito = val==='debito';
            if(cartaoCampos) cartaoCampos.style.display=isPix?'none':'grid';
            if(pixInfo) pixInfo.style.display=isPix?'grid':'none';
            if(parcelasWrap) parcelasWrap.style.display= isPix || isDebito ? 'none' : 'grid';
            // atualiza visual dos labels
            document.querySelectorAll('.checkout-radio').forEach(l=>{ l.style.borderColor='var(--border)'; l.style.background='var(--surface)'; l.classList.remove('checked'); });
            const lab=e.target.closest('.checkout-radio');
            if(lab){ lab.style.borderColor='var(--primary)'; lab.style.background='var(--primary-light)'; lab.classList.add('checked'); }
        });
    });

    // atualiza parcelas quando total mudar (chamado externamente)
    window.atualizarParcelasPagamento = atualizarParcelas;
}

// ---------- Validação e Confirmação (ETAPA 4) ----------
function validarCPF(cpf){
    const v=(cpf||'').replace(/\D/g,'');
    if(v.length!==11) return false;
    if(/^(\d)\1{10}$/.test(v)) return false;
    // validação simples, não rigorosa (suficiente para demo)
    return true;
}
function limparErrosCheckout(){
    document.querySelectorAll('#carrinho-container .field-error').forEach(el=>{ el.textContent=''; el.classList.remove('show'); });
    document.querySelectorAll('#carrinho-container .input').forEach(el=>{ el.classList.remove('input--error'); el.removeAttribute('aria-invalid'); });
}
function mostrarErroCheckout(id, msg){
    const el=document.getElementById(id);
    if(el){ el.textContent=msg; el.classList.add('show'); }
    const inputId=id.replace('erro-','');
    const input=document.getElementById(inputId);
    if(input){ input.classList.add('input--error'); input.setAttribute('aria-invalid','true'); }
}
function gerarProtocoloPedido(){
    const key='techstore_pedidos_seq';
    let seq=1;
    try{
        const raw=localStorage.getItem(key);
        seq = raw ? parseInt(raw,10)+1 : 1;
        localStorage.setItem(key, String(seq));
    }catch{}
    return '#TS-' + String(seq).padStart(6,'0');
}
function mostrarConfirmacaoPedido(pedido){
    const container=document.getElementById('carrinho-container');
    if(!container) return;
    const formaTxt = pedido.forma==='pix' ? 'PIX (demonstrativo)' : (pedido.bandeira ? `${pedido.bandeira} final ${pedido.ultimos4} • ${pedido.parcelas}` : pedido.forma);
    container.innerHTML=`
        <div style="grid-column:1/-1; max-width:640px; margin:0 auto; text-align:center; background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:32px 24px; box-shadow:var(--shadow-lg)">
            <div style="width:56px; height:56px; margin:0 auto 14px; background:#16a34a; color:#fff; border-radius:50%; display:grid; place-items:center; font-size:1.6rem">✓</div>
            <h2 style="font-size:1.5rem; font-weight:800; margin-bottom:6px">Pedido realizado com sucesso!</h2>
            <p style="color:var(--text-muted); margin-bottom:18px">Obrigado pela sua compra. Seu pedido foi registrado como demonstrativo (sem cobrança real).</p>
            <div style="background:var(--background); border:1px solid var(--border); border-radius:12px; padding:16px; text-align:left; display:grid; gap:8px; font-size:.92rem">
                <div style="display:flex; justify-content:space-between"><span style="color:var(--text-muted)">Número do pedido</span><strong>${pedido.protocolo}</strong></div>
                <div style="display:flex; justify-content:space-between"><span style="color:var(--text-muted)">Valor total</span><strong>${formatarPreco(pedido.total)}</strong></div>
                <div style="display:flex; justify-content:space-between"><span style="color:var(--text-muted)">Forma de pagamento</span><strong>${formaTxt}</strong></div>
                <div style="display:flex; justify-content:space-between"><span style="color:var(--text-muted)">Prazo estimado</span><strong>${pedido.prazo||'3 a 6 dias úteis'}</strong></div>
                <div style="padding-top:8px; border-top:1px dashed var(--border); margin-top:4px">
                    <div style="font-weight:700; margin-bottom:4px">Endereço de entrega</div>
                    <div style="color:var(--text-muted); line-height:1.5">${pedido.endereco.rua}, ${pedido.endereco.numero}${pedido.endereco.complemento ? ' - '+pedido.endereco.complemento : ''}<br>${pedido.endereco.bairro} • ${pedido.endereco.cidade} - ${pedido.endereco.estado}<br>CEP ${pedido.endereco.cep}</div>
                </div>
            </div>
            <div style="display:flex; gap:10px; justify-content:center; margin-top:20px; flex-wrap:wrap">
                <a href="produtos.html" class="btn btn--primary">Continuar comprando</a>
                <a href="index.html" class="btn btn--ghost">Voltar à loja</a>
            </div>
            <p style="font-size:.78rem; color:var(--text-muted); margin-top:14px">Demonstração frontend — nenhum dado sensível de cartão foi armazenado (apenas bandeira e últimos 4 dígitos).</p>
        </div>
    `;
    window.scrollTo({ top:0, behavior:'smooth' });
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
    const dadosHTML = criarDadosPessoaisHTML();
    const enderecoHTML = criarEnderecoDetalhadoHTML();
    const pagamentoHTML = criarPagamentoHTML(total);

    const freteResumo = frete.loading
        ? `<span class="entrega-loading">Calculando frete...</span>`
        : (frete.gratuito ? '<span class="frete-gratis">Grátis</span>' : formatarPreco(frete.valor));

    const resumoHTML = `
        <div class="carrinho-lista">
            ${listaHTML}
        </div>
        <aside class="carrinho-resumo">
            ${entregaHTML}
            ${dadosHTML}
            ${enderecoHTML}
            ${pagamentoHTML}
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
    try{ aplicarMascarasCheckout(); }catch{}
    try{ aplicarMascarasPagamento(total); }catch{}
    // atualiza parcelas se total mudou (para já renderizado)
    try{ if(window.atualizarParcelasPagamento) window.atualizarParcelasPagamento(); }catch{}
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
    // valida checkout
    limparErrosCheckout();
    let hasError=false;
    const nomeEl=document.getElementById('checkout-nome');
    const cpfEl=document.getElementById('checkout-cpf');
    const emailEl=document.getElementById('checkout-email');
    const telEl=document.getElementById('checkout-telefone');
    const cepEl=document.getElementById('checkout-cep');
    const ruaEl=document.getElementById('checkout-rua');
    const numEl=document.getElementById('checkout-numero');
    const bairroEl=document.getElementById('checkout-bairro');
    const cidadeEl=document.getElementById('checkout-cidade');
    const estadoEl=document.getElementById('checkout-estado');

    const nome=(nomeEl?nomeEl.value.trim():'');
    const cpf=(cpfEl?cpfEl.value.trim():'');
    const email=(emailEl?emailEl.value.trim():'');
    const tel=(telEl?telEl.value.trim():'');
    const cep=(cepEl?cepEl.value.trim():'') || (typeof obterCEP==='function'? obterCEP():'');
    const rua=(ruaEl?ruaEl.value.trim():'');
    const numero=(numEl?numEl.value.trim():'');
    const complemento=(document.getElementById('checkout-complemento')? document.getElementById('checkout-complemento').value.trim() : '');
    const bairro=(bairroEl?bairroEl.value.trim():'');
    const cidade=(cidadeEl?cidadeEl.value.trim():'');
    const estado=(estadoEl?estadoEl.value.trim().toUpperCase():'');
    const formaEl=document.querySelector('input[name="forma-pagamento"]:checked');
    const forma= formaEl ? formaEl.value : 'credito';

    if(!nome || nome.length<3){ mostrarErroCheckout('erro-checkout-nome','Informe seu nome completo.'); hasError=true; }
    if(!cpf || !validarCPF(cpf)){ mostrarErroCheckout('erro-checkout-cpf','CPF inválido. Use 000.000.000-00'); hasError=true; }
    if(!email || (typeof validarEmail==='function' ? !validarEmail(email) : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))){ mostrarErroCheckout('erro-checkout-email','E-mail inválido.'); hasError=true; }
    const telDigits=(tel||'').replace(/\D/g,'');
    if(!tel || telDigits.length<10){ mostrarErroCheckout('erro-checkout-telefone','Telefone inválido. Use (00) 00000-0000'); hasError=true; }
    if(!cep || (typeof validarCEP==='function' ? !validarCEP(cep) : cep.replace(/\D/g,'').length!==8)){ mostrarErroCheckout('erro-checkout-cep','CEP inválido.'); hasError=true; }
    // endereço: rua/bairro/cidade/estado/numero obrigatórios (complemento opcional)
    if(!rua){ mostrarErroCheckout('erro-checkout-rua','Informe a rua.'); hasError=true; }
    if(!numero){ mostrarErroCheckout('erro-checkout-numero','Informe o número.'); hasError=true; }
    if(!bairro){ mostrarErroCheckout('erro-checkout-bairro','Informe o bairro.'); hasError=true; }
    if(!cidade){ mostrarErroCheckout('erro-checkout-cidade','Informe a cidade.'); hasError=true; }
    if(!estado || estado.length!==2){ mostrarErroCheckout('erro-checkout-estado','UF com 2 letras.'); hasError=true; }

    // pagamento
    let bandeira='', ultimos4='', parcelasTxt='';
    if(forma !== 'pix'){
        const numEl2=document.getElementById('checkout-cartao-numero');
        const nomeCartaoEl=document.getElementById('checkout-cartao-nome');
        const valEl=document.getElementById('checkout-cartao-validade');
        const cvvEl2=document.getElementById('checkout-cartao-cvv');
        const parcEl=document.getElementById('checkout-parcelas');
        const numRaw=(numEl2?numEl2.value.trim():'');
        const numDigits=numRaw.replace(/\D/g,'');
        const nomeCartao=(nomeCartaoEl?nomeCartaoEl.value.trim():'');
        const validade=(valEl?valEl.value.trim():'');
        const cvv=(cvvEl2?cvvEl2.value.trim():'');
        bandeira=detectarBandeira(numRaw);
        ultimos4=numDigits.slice(-4);
        // validações cartão
        if(numDigits.length<13 || numDigits.length>19){ mostrarErroCheckout('erro-checkout-cartao-numero','Número inválido (13-19 dígitos).'); hasError=true; }
        if(!nomeCartao || nomeCartao.length<3){ mostrarErroCheckout('erro-checkout-cartao-nome','Informe o nome do cartão.'); hasError=true; }
        if(!/^\d{2}\/\d{2}$/.test(validade)){ mostrarErroCheckout('erro-checkout-cartao-validade','Use MM/AA.'); hasError=true; }
        else {
            const [mm,aa]=validade.split('/').map(Number);
            if(mm<1||mm>12){ mostrarErroCheckout('erro-checkout-cartao-validade','Mês inválido.'); hasError=true; }
            else {
                const now=new Date(); const curYY=now.getFullYear()%100; const curMM=now.getMonth()+1;
                if(aa<curYY || (aa===curYY && mm<curMM)){ mostrarErroCheckout('erro-checkout-cartao-validade','Cartão vencido.'); hasError=true; }
            }
        }
        if(!/^\d{3,4}$/.test(cvv)){ mostrarErroCheckout('erro-checkout-cartao-cvv','CVV 3 ou 4 dígitos.'); hasError=true; }
        if(forma==='credito'){
            if(!parcEl || !parcEl.value){ mostrarErroCheckout('erro-checkout-cartao-numero','Selecione o parcelamento.'); hasError=true; }
            else {
                const sel=parcEl.options[parcEl.selectedIndex];
                parcelasTxt = sel ? sel.textContent : parcEl.value + 'x';
            }
        } else {
            parcelasTxt='À vista (débito)';
        }
        if(hasError){
            // não armazena CVV/número completo em caso de erro
        }
    } else {
        parcelasTxt='PIX à vista';
    }

    if(hasError){
        mostrarToast('Corrija os campos destacados e tente novamente.', 'error');
        const firstErr=document.querySelector('#carrinho-container .input--error');
        try{ firstErr && firstErr.scrollIntoView({behavior:'smooth', block:'center'}); }catch{}
        // shake no resumo
        const resumo=document.querySelector('.carrinho-resumo');
        if(resumo){ resumo.classList.remove('shake'); void resumo.offsetWidth; resumo.classList.add('shake'); setTimeout(()=>resumo.classList.remove('shake'),500); }
        return;
    }

    const subtotal = carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0);
    const frete = getFreteSync();
    const freteValor = frete.loading ? 0 : frete.valor;
    const totalComFrete = subtotal + freteValor;
    const protocolo=gerarProtocoloPedido();
    const pedido={
        id: Date.now(),
        protocolo,
        data: new Date().toISOString(),
        cliente: nome,
        email, telefone: tel, cpf: cpf.replace(/\D/g,'').slice(0,3)+'***.***-'+cpf.slice(-2), // mascarado
        endereco: { cep: (typeof formatarCEP==='function'? formatarCEP(cep):cep), rua, numero, complemento, bairro, cidade, estado },
        forma, bandeira: bandeira|| (forma==='pix'?'PIX':''), ultimos4: ultimos4||'', parcelas: parcelasTxt,
        subtotal, frete: freteValor, total: totalComFrete,
        prazo: frete.prazo || '3 a 6 dias úteis',
        itens: carrinho.map(i=> ({ id:i.id, nome:i.nome, preco:i.preco, quantidade:i.quantidade })),
        status: 'Pago' // demonstrativo
    };
    // salva pedido demonstrativo (sem dados sensíveis: sem número completo/CVV)
    try{
        const key='techstore_pedidos';
        let lista=[];
        try{ const raw=localStorage.getItem(key); lista= raw? JSON.parse(raw):[]; if(!Array.isArray(lista)) lista=[]; }catch{}
        // adapta para formato admin (id, cliente, data, valor, status)
        lista.push({ id: protocolo.replace('#TS-',''), cliente: nome, data: new Date().toLocaleDateString('pt-BR'), valor: totalComFrete, status: 'Pago', _full: pedido });
        localStorage.setItem(key, JSON.stringify(lista));
        // também salva último pedido para confirmação
        localStorage.setItem('techstore_ultimo_pedido', JSON.stringify(pedido));
    }catch{}
    // limpa carrinho e mostra confirmação
    localStorage.removeItem(CART_KEY);
    atualizarContadorCarrinho();
    mostrarConfirmacaoPedido(pedido);
    mostrarToast(`Pedido ${protocolo} realizado!`, 'success');
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
