// TechStore - cep.js (ETAPA 1 + 2)
// Modal de CEP + LocalStorage + ViaCEP
// Chave simples: cepEntrega
// Funções reutilizáveis: obterCEP, salvarCEP, validarCEP, abrirModalCEP, fecharModalCEP, alterarCEP
// ETAPA 2: consulta ViaCEP (logradouro, bairro, cidade, estado) com tratamento de erro e loading

const CEP_KEY = 'cepEntrega';
const ENDERECO_KEY = 'cepEndereco';

function apenasDigitos(str) {
    return (str || '').replace(/\D/g, '');
}

function formatarCEP(cep) {
    const d = apenasDigitos(cep).slice(0, 8);
    if (d.length <= 5) return d;
    return d.slice(0, 5) + '-' + d.slice(5);
}

function validarCEP(cep) {
    const d = apenasDigitos(cep);
    return d.length === 8;
}

function obterCEP() {
    try {
        const v = localStorage.getItem(CEP_KEY);
        return v ? v : null;
    } catch { return null; }
}

function salvarCEP(cep) {
    const fmt = formatarCEP(cep);
    if (!validarCEP(fmt)) return false;
    try { localStorage.setItem(CEP_KEY, fmt); } catch {}
    // limpa endereço antigo se CEP mudou (será re-consultado)
    try {
        const antigo = localStorage.getItem(CEP_KEY);
        // na verdade já salvamos; compara com endereco salvo
        const endRaw = localStorage.getItem(ENDERECO_KEY);
        if (endRaw) {
            const end = JSON.parse(endRaw);
            if (end && end.cep && apenasDigitos(end.cep) !== apenasDigitos(fmt)) {
                localStorage.removeItem(ENDERECO_KEY);
            }
        }
    } catch {}
    atualizarBarraCEP();
    try { window.dispatchEvent(new CustomEvent('cep:alterado', { detail: { cep: fmt } })); } catch {}
    return fmt;
}

// ---------- Endereço ViaCEP ----------

function obterEndereco() {
    try {
        const raw = localStorage.getItem(ENDERECO_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function salvarEndereco(endereco) {
    try { localStorage.setItem(ENDERECO_KEY, JSON.stringify(endereco)); } catch {}
    atualizarBarraCEP();
}

function formatarEnderecoCurto(end) {
    if (!end || !end.cidade || !end.estado) return '';
    // Ex: "Cabo Frio - RJ" ou "Centro, Cabo Frio - RJ"
    if (end.bairro) return `${end.cidade} - ${end.estado}`;
    return `${end.cidade} - ${end.estado}`;
}

/**
 * Consulta ViaCEP - somente para endereço.
 * Retorna { cep, logradouro, bairro, cidade, estado, logradouroCompleto } ou lança erro.
 * Mensagem amigável em caso de falha.
 */
async function consultarCEP(cep) {
    const limpo = apenasDigitos(cep);
    if (limpo.length !== 8) throw new Error('CEP deve conter 8 dígitos.');
    const url = `https://viacep.com.br/ws/${limpo}/json/`;
    let resp;
    try {
        resp = await fetch(url, { method: 'GET' });
    } catch {
        throw new Error('Não foi possível consultar este CEP. Verifique sua conexão e tente novamente.');
    }
    if (!resp.ok) throw new Error('Não foi possível consultar este CEP. Verifique o número e tente novamente.');
    let data;
    try { data = await resp.json(); } catch { throw new Error('Não foi possível consultar este CEP. Verifique o número e tente novamente.'); }
    if (data.erro) throw new Error('CEP não encontrado. Verifique o número e tente novamente.');
    const endereco = {
        cep: formatarCEP(limpo),
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
        complemento: data.complemento || ''
    };
    // não inventa: se cidade/estado vazios, considera incompleto mas ainda salva o que houver
    return endereco;
}

// ---------- Frete DEMONSTRATIVO (ETAPA 3/4) ----------
/**
 * calcularFrete - ESTRUTURA PARA API REAL FUTURA
 * ------------------------------------------------------------
 * IMPORTANTE: Este é um cálculo DEMONSTRATIVO e NÃO representa
 * valor real de transportadora. Deixe isolado para substituição.
 * Futuramente substituir por chamada a Correios / Melhor Envio / Frenet:
 *   const resp = await fetch(`https://api.frete.com/calcular`, { method:'POST', body: JSON.stringify({ cep, produtos }) })
 *   Não expor chaves secretas no frontend.
 * Por enquanto retorna valor fixo de demonstração com pequena variação por estado/quantidade.
 * ------------------------------------------------------------
 * @param {string} cep - CEP de entrega (formato 00000-000)
 * @param {Array<{preco:number, quantidade:number}>} produtos
 * @returns {Promise<{valor:number, prazo:string, nome:string, gratuito:boolean}>}
 */
async function calcularFrete(cep, produtos) {
    // demonstração: simula latência de rede sem travar UI
    await new Promise(r => setTimeout(r, 350));

    const lista = Array.isArray(produtos) ? produtos : [];
    const subtotal = lista.reduce((s, p) => s + (Number(p.preco) || 0) * (Number(p.quantidade) || 0), 0);
    const qtd = lista.reduce((s, p) => s + (Number(p.quantidade) || 0), 0);

    // validação básica; se CEP inválido ou carrinho vazio, não calcula
    if (!cep || !validarCEP(cep) || lista.length === 0) {
        return { valor: 0, prazo: '', nome: '', gratuito: false };
    }

    // REGRA DEMONSTRATIVA (não é real):
    // - Subtotal >= 500 => frete grátis (mantém regra atual da loja)
    // - Caso contrário: base R$ 19,90 + R$ 1,50 por item extra + ajuste por UF (ex: RJ/SP mais barato)
    if (subtotal >= 500) {
        return { valor: 0, prazo: '3 a 6 dias úteis', nome: 'Frete padrão', gratuito: true };
    }

    let base = 19.90;
    // ajuste demonstrativo por estado (se endereço cacheado)
    try {
        const end = obterEndereco();
        if (end && end.estado) {
            const uf = end.estado.toUpperCase();
            if (['SP','RJ','MG','ES'].includes(uf)) base = 15.90;
            else if (['RS','SC','PR'].includes(uf)) base = 22.90;
            else if (['BA','PE','CE'].includes(uf)) base = 24.90;
            else base = 27.90;
        }
    } catch {}

    const extra = Math.max(0, qtd - 1) * 1.50;
    const valor = Math.round((base + extra) * 100) / 100;

    return { valor, prazo: '3 a 6 dias úteis', nome: 'Frete padrão', gratuito: false };
}

/**
 * Busca e armazena endereço para o CEP atual (se ainda não estiver em cache).
 * Retorna endereco ou null. Nunca lança para não quebrar fluxo.
 */
async function garantirEndereco(cep) {
    const alvo = cep ? formatarCEP(cep) : obterCEP();
    if (!alvo || !validarCEP(alvo)) return null;
    const cache = obterEndereco();
    if (cache && apenasDigitos(cache.cep) === apenasDigitos(alvo) && cache.cidade) return cache;
    try {
        const end = await consultarCEP(alvo);
        salvarEndereco(end);
        return end;
    } catch (e) {
        // mantém CEP salvo mesmo sem endereço; apenas não salva endereço inventado
        return null;
    }
}

function atualizarBarraCEP() {
    const bar = document.getElementById('cep-bar');
    const val = document.getElementById('cep-valor');
    const endEl = document.getElementById('cep-endereco');
    const cep = obterCEP();
    if (!bar || !val) return;
    if (cep && validarCEP(cep)) {
        val.textContent = cep;
        const end = obterEndereco();
        if (endEl) {
            if (end && end.cidade && end.estado) {
                endEl.textContent = `— ${formatarEnderecoCurto(end)}`;
                if (end.logradouro) endEl.title = `${end.logradouro}${end.bairro ? ', ' + end.bairro : ''} • ${end.cidade} - ${end.estado}`;
                else endEl.title = `${end.cidade} - ${end.estado}`;
                endEl.style.display = 'inline';
            } else {
                endEl.textContent = '';
                endEl.style.display = 'none';
                endEl.title = '';
            }
        }
        bar.style.display = 'block';
        bar.setAttribute('aria-hidden', 'false');
    } else {
        bar.style.display = 'none';
        bar.setAttribute('aria-hidden', 'true');
    }
}

function abrirModalCEP() {
    const modal = document.getElementById('cep-modal');
    if (!modal) return;
    const input = document.getElementById('cep-input');
    const atual = obterCEP();
    if (input) {
        input.value = atual ? atual : '';
        input.classList.remove('input--error');
        const err = document.getElementById('cep-erro');
        if (err) { err.textContent = ''; err.classList.remove('show'); }
        const endPreview = document.getElementById('cep-endereco-preview');
        if (endPreview) endPreview.style.display = 'none';
        const btn = document.getElementById('cep-continuar');
        const txt = document.getElementById('cep-btn-text');
        const ldr = document.getElementById('cep-loader');
        if (btn) btn.disabled = false;
        if (txt) { try { txt.classList.remove('hidden'); txt.style.opacity = '1'; } catch {} }
        if (ldr) ldr.style.display = 'none';
        setTimeout(() => { try { input.focus(); } catch {} }, 80);
    }
    // mostra endereço atual no modal se existir
    const preview = document.getElementById('cep-endereco-preview');
    const end = obterEndereco();
    if (preview && end && end.cidade) {
        preview.innerHTML = `✓ Entrega para <strong>${end.cidade} - ${end.estado}</strong>${end.logradouro ? `<br><span style="font-size:.82rem; color:var(--text-muted)">${end.logradouro}${end.bairro ? ', '+end.bairro : ''}</span>` : ''}`;
        preview.style.display = 'block';
        preview.className = 'cep-endereco-preview show';
    }
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function fecharModalCEP() {
    const modal = document.getElementById('cep-modal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function alterarCEP() {
    abrirModalCEP();
}

function criarEstruturaCEP() {
    if (!document.getElementById('cep-bar')) {
        const header = document.getElementById('header');
        const bar = document.createElement('div');
        bar.id = 'cep-bar';
        bar.className = 'cep-bar';
        bar.setAttribute('aria-live', 'polite');
        bar.style.display = 'none';
        bar.innerHTML = `
            <div class="container cep-bar__content">
                <span class="cep-bar__info">\uD83D\uDCE6 Entrega para <strong id="cep-valor"></strong> <span id="cep-endereco" class="cep-bar__endereco" style="display:none"></span></span>
                <button type="button" class="cep-bar__btn" id="cep-alterar-btn">Alterar CEP</button>
            </div>
        `;
        if (header && header.parentNode) header.insertAdjacentElement('afterend', bar);
        else document.body.prepend(bar);
        const btn = document.getElementById('cep-alterar-btn');
        if (btn) btn.addEventListener('click', alterarCEP);
    }

    if (!document.getElementById('cep-modal')) {
        const modal = document.createElement('div');
        modal.id = 'cep-modal';
        modal.className = 'cep-modal';
        modal.setAttribute('aria-hidden', 'true');
        modal.innerHTML = `
            <div class="cep-modal__overlay" id="cep-overlay"></div>
            <div class="cep-modal__content" role="dialog" aria-modal="true" aria-labelledby="cep-modal-title">
                <button type="button" class="cep-modal__close" id="cep-modal-close" aria-label="Fechar modal">&times;</button>
                <div class="cep-modal__header">
                    <div class="cep-modal__icon" aria-hidden="true">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.7"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    </div>
                    <h2 id="cep-modal-title" class="cep-modal__title">Informe seu CEP</h2>
                    <p class="cep-modal__desc">Informe seu CEP para calcularmos o frete e mostrar opções de entrega.</p>
                </div>
                <form id="cep-form" class="cep-form" novalidate>
                    <label for="cep-input" class="cep-label">CEP</label>
                    <div class="cep-input-wrap">
                        <input type="text" id="cep-input" class="cep-input" placeholder="00000-000" inputmode="numeric" maxlength="9" autocomplete="postal-code" aria-describedby="cep-erro">
                    </div>
                    <span id="cep-erro" class="cep-erro" aria-live="polite"></span>
                    <div id="cep-endereco-preview" class="cep-endereco-preview" style="display:none"></div>
                    <button type="submit" class="btn btn--primary cep-btn" id="cep-continuar">
                        <span class="btn-text" id="cep-btn-text">Continuar</span>
                        <span class="cep-loader" id="cep-loader" style="display:none" aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity=".3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
                        </span>
                    </button>
                </form>
                <button type="button" class="cep-link" id="cep-fechar-link">Continuar sem CEP</button>
            </div>
        `;
        document.body.appendChild(modal);

        const overlay = document.getElementById('cep-overlay');
        const closeBtn = document.getElementById('cep-modal-close');
        const linkFechar = document.getElementById('cep-fechar-link');
        const form = document.getElementById('cep-form');
        const input = document.getElementById('cep-input');

        function onClose() { fecharModalCEP(); }

        if (overlay) overlay.addEventListener('click', onClose);
        if (closeBtn) closeBtn.addEventListener('click', onClose);
        if (linkFechar) linkFechar.addEventListener('click', onClose);

        document.addEventListener('keydown', (e) => {
            const m = document.getElementById('cep-modal');
            if (e.key === 'Escape' && m && m.classList.contains('open')) onClose();
        });

        if (input) {
            input.addEventListener('input', () => {
                const start = input.selectionStart;
                const before = input.value;
                const fmt = formatarCEP(input.value);
                input.value = fmt;
                try {
                    const diff = fmt.length - before.length;
                    const pos = Math.max(0, (start || 0) + diff);
                    input.setSelectionRange(pos, pos);
                } catch {}
                const err = document.getElementById('cep-erro');
                if (err) { err.textContent = ''; err.classList.remove('show'); }
                input.classList.remove('input--error');
                const preview = document.getElementById('cep-endereco-preview');
                if (preview) preview.style.display = 'none';
            });
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const inp = document.getElementById('cep-input');
                const err = document.getElementById('cep-erro');
                const btn = document.getElementById('cep-continuar');
                const btnText = document.getElementById('cep-btn-text') || (btn && btn.querySelector ? btn.querySelector('.btn-text') : null);
                const loader = document.getElementById('cep-loader') || (btn && btn.querySelector ? btn.querySelector('.cep-loader') : null);
                const raw = inp ? inp.value : '';
                if (!raw.trim()) {
                    if (err) { err.textContent = 'Informe seu CEP.'; err.classList.add('show'); }
                    if (inp) inp.classList.add('input--error');
                    return;
                }
                if (!validarCEP(raw)) {
                    if (err) { err.textContent = 'CEP inválido. Use 8 dígitos (ex: 28900-000).'; err.classList.add('show'); }
                    if (inp) inp.classList.add('input--error');
                    return;
                }
                // loading
                if (btn) btn.disabled = true;
                if (btnText) btnText.style.opacity = '0';
                if (loader) { loader.style.display = 'inline-flex'; loader.style.position = 'absolute'; loader.style.left = '50%'; loader.style.top = '50%'; loader.style.transform = 'translate(-50%,-50%)'; loader.style.animation = 'spin .8s linear infinite'; }
                if (btn) { btn.style.position = 'relative'; }
                // limpa preview
                const preview = document.getElementById('cep-endereco-preview');
                if (preview) preview.style.display = 'none';
                if (err) { err.textContent = ''; err.classList.remove('show'); }

                const salvo = salvarCEP(raw);
                if (!salvo) {
                    if (err) { err.textContent = 'Não foi possível salvar este CEP.'; err.classList.add('show'); }
                    if (btn) btn.disabled = false;
                    if (btnText) btnText.style.opacity = '1';
                    if (loader) loader.style.display = 'none';
                    return;
                }

                // consulta ViaCEP
                try {
                    const end = await consultarCEP(salvo);
                    salvarEndereco(end);
                    if (preview) {
                        preview.innerHTML = `✓ Entrega para <strong>${end.cidade} - ${end.estado}</strong><br><span style="font-size:.82rem; color:var(--text-muted)">${end.logradouro ? end.logradouro + (end.bairro ? ', ' + end.bairro : '') : end.bairro || ''}</span>`;
                        preview.style.display = 'block';
                        preview.className = 'cep-endereco-preview show cep-endereco-preview--success';
                    }
                    atualizarBarraCEP();
                    if (typeof mostrarToast === 'function') mostrarToast(`Entrega para ${end.cidade} - ${end.estado}`, 'success');
                    setTimeout(() => { fecharModalCEP(); }, 700);
                } catch (e2) {
                    // CEP salvo mas endereço falhou: mostra erro amigável, mantém CEP na barra sem cidade
                    // não inventa endereço
                    if (err) { err.textContent = e2.message || 'Não foi possível consultar este CEP. Verifique o número e tente novamente.'; err.classList.add('show'); }
                    // remove endereco antigo para não exibir cidade errada
                    try { localStorage.removeItem(ENDERECO_KEY); } catch {}
                    atualizarBarraCEP();
                    if (typeof mostrarToast === 'function') mostrarToast(err.textContent, 'error');
                    // mantém modal aberto para usuário corrigir se quiser; mas permite fechar manualmente
                    // opcional: ainda fecha se quiser, aqui mantemos aberto para correção
                } finally {
                    if (btn) btn.disabled = false;
                    if (btnText) btnText.style.opacity = '1';
                    if (loader) loader.style.display = 'none';
                    // se sucesso, modal já fechará; se falha, usuário pode corrigir
                    // para CEPs válidos mas ViaCEP falhou por rede, ainda consideramos CEP salvo e fechamos?
                    // Neste caso deixamos CEP salvo e usuário pode fechar manualmente; não força fechar automático em erro
                    const endOk = obterEndereco();
                    if (endOk && validarCEP(salvo)) {
                        // já fechado acima
                    }
                }
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    criarEstruturaCEP();
    atualizarBarraCEP();

    // se tem CEP mas não tem endereço cacheado, busca em background (ETAPA 2)
    const cep = obterCEP();
    if (cep && validarCEP(cep)) {
        const cached = obterEndereco();
        if (!cached || apenasDigitos(cached.cep) !== apenasDigitos(cep)) {
            // busca silenciosa
            try { await garantirEndereco(cep); } catch {}
            atualizarBarraCEP();
        }
    }

    if (!cep || !validarCEP(cep)) {
        const isAuth = document.body.classList.contains('auth-page');
        if (!isAuth) setTimeout(() => abrirModalCEP(), 600);
    }
});

window.obterCEP = obterCEP;
window.salvarCEP = salvarCEP;
window.validarCEP = validarCEP;
window.formatarCEP = formatarCEP;
window.abrirModalCEP = abrirModalCEP;
window.fecharModalCEP = fecharModalCEP;
window.alterarCEP = alterarCEP;
window.consultarCEP = consultarCEP;
window.obterEndereco = obterEndereco;
window.garantirEndereco = garantirEndereco;
window.calcularFrete = calcularFrete;
window.TechStoreCEP = { obterCEP, salvarCEP, validarCEP, formatarCEP, abrirModalCEP, fecharModalCEP, alterarCEP, consultarCEP, obterEndereco, garantirEndereco, calcularFrete, CEP_KEY, ENDERECO_KEY };
