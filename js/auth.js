/* ============================================
   TechStore - auth.js
   Sistema de autenticação front-end (DEMO)
   ============================================
   ATENÇÃO: Este arquivo é apenas uma simulação
   front-end para estudo/demonstração.
   - localStorage NÃO é seguro para auth real.
   - Em produção use backend, banco de dados,
     hash com salt (bcrypt/argon2), HTTPS,
     e recuperação por e-mail real.
   - Aqui usamos SHA-256 via Web Crypto API
     apenas para não armazenar senha em texto puro
     no localStorage, mas NÃO é suficiente para
     produção.
   Estrutura preparada para futura troca por API.
   ============================================ */

const USERS_KEY = 'techstore_users';
const CURRENT_KEY = 'techstore_currentUser';
const RESET_KEY = 'techstore_reset';

// ADMIN DEMO — APENAS PROTÓTIPO FRONT-END, NÃO É SEGURO PARA PRODUÇÃO
// Em produção use backend, hash com salt, sessões seguras, HTTPS e RBAC no servidor.
// Credenciais de demonstração (não exibir na UI pública):
//   admin@techstore.com / TechStore@Admin2026
//   ryan.souza@techstore.com / Ryan@TechStore2026!  <-- SEU ACESSO EXCLUSIVO
// Hashes SHA-256 (não armazene senha em texto puro):
const ADMIN_USERS = [
    { email: 'admin@techstore.com', hash: 'bcee2a0ca08e57a9e79114c9b3a09ac34d57774e4cb2e3e161c3d55deeffc63f', nome: 'Administrador' },
    { email: 'ryan.souza@techstore.com', hash: 'fe76b40c9ec0b7084dd47b07183bf326083e28354e76b7a140e3e52ac1b4ad2d', nome: 'Ryan Souza' }
];
// Compatibilidade: mantém constantes antigas apontando para o primeiro admin
const ADMIN_EMAIL = ADMIN_USERS[0].email;
const ADMIN_HASH = ADMIN_USERS[0].hash;

// ---------- Utilidades base ----------

function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarSenha(senha) {
    return typeof senha === 'string' && senha.length >= 8;
}

// SHA-256 hex via Web Crypto. Fallback simples se não disponível.
async function hashSenha(senha) {
    // DEMO: hash para não deixar texto puro no localStorage
    // NÃO usar como segurança real.
    try {
        if (window.crypto && window.crypto.subtle) {
            const enc = new TextEncoder();
            const buf = await crypto.subtle.digest('SHA-256', enc.encode(senha));
            return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
    } catch (_) {}
    // fallback (não seguro, apenas para file:// sem subtle)
    let h = 0;
    for (let i = 0; i < senha.length; i++) h = (Math.imul(31, h) + senha.charCodeAt(i)) | 0;
    return 'fallback_' + Math.abs(h).toString(16) + '_' + btoa(senha).slice(0, 12);
}

function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function gerarToken() {
    // token aleatório curto para demo
    const a = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) crypto.getRandomValues(a);
    else for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256);
    return Array.from(a).map(b => b.toString(16).padStart(2, '0')).join('') + '-' + Date.now().toString(36);
}

// ---------- Storage ----------

function getUsuarios() {
    try {
        const raw = localStorage.getItem(USERS_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch { return []; }
}

function setUsuarios(arr) {
    localStorage.setItem(USERS_KEY, JSON.stringify(arr));
}

function buscarUsuario(email) {
    const e = (email || '').trim().toLowerCase();
    return getUsuarios().find(u => (u.email || '').toLowerCase() === e) || null;
}

function salvarUsuario({ nome, email, senhaHash }) {
    const usuarios = getUsuarios();
    const novo = {
        id: gerarId(),
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senhaHash,
        criadoEm: new Date().toISOString()
    };
    usuarios.push(novo);
    setUsuarios(usuarios);
    return novo;
}

function getCurrentUser() {
    try {
        const raw = localStorage.getItem(CURRENT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function setCurrentUser(user) {
    // armazena apenas dados não sensíveis + tipo de sessão
    const safe = {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo || 'cliente',
        autenticado: true
    };
    localStorage.setItem(CURRENT_KEY, JSON.stringify(safe));
}

function logout() {
    localStorage.removeItem(CURRENT_KEY);
    // não apaga usuários nem reset token aqui; reset é invalidado só em redefinirSenha
}

function isAdmin() {
    const u = getCurrentUser();
    return !!(u && u.autenticado && u.tipo === 'admin');
}

function protegerPaginaAdmin() {
    if (!isAdmin()) {
        const inAdmin = window.location.pathname.includes('/admin');
        // redireciona para login.html (relativo ao nível admin)
        window.location.href = inAdmin ? '../login.html' : 'login.html';
        return false;
    }
    return true;
}

// Wrapper login() para compatibilidade com spec (diferencia cliente/admin)
async function login(email, senha) {
    const normalized = (email || '').trim().toLowerCase();
    // tenta admin primeiro (não está em techstore_users) - suporta múltiplos admins
    const admin = ADMIN_USERS.find(a => a.email.toLowerCase() === normalized);
    if (admin) {
        const h = await hashSenha(senha);
        if (h === admin.hash) {
            const adminUser = { id: 'admin-' + normalized.replace(/[^a-z0-9]/g,''), nome: admin.nome, email: admin.email, tipo: 'admin' };
            setCurrentUser(adminUser);
            return { ok: true, user: adminUser, isAdmin: true };
        }
        return { ok: false, erro: 'Senha incorreta.' };
    }
    // cliente normal
    const res = await fazerLogin(email, senha);
    if (res.ok) {
        // garante tipo cliente
        const u = getCurrentUser();
        if (u && !u.tipo) {
            u.tipo = 'cliente';
            localStorage.setItem(CURRENT_KEY, JSON.stringify(u));
        }
    }
    return res;
}

// ---------- Reset token (demo) ----------

function getResetData() {
    try {
        const raw = localStorage.getItem(RESET_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function setResetData(data) {
    localStorage.setItem(RESET_KEY, JSON.stringify(data));
}

function validarToken(token) {
    const data = getResetData();
    if (!data || !data.token || !data.email || !data.expiresAt) return { valido: false, motivo: 'Nenhum token encontrado. Solicite um novo link em "Esqueci minha senha".' };
    if (data.token !== token) return { valido: false, motivo: 'Token inválido.' };
    if (Date.now() > data.expiresAt) return { valido: false, motivo: 'Token expirado. Solicite um novo link (validade 15 min).' };
    const user = buscarUsuario(data.email);
    if (!user) return { valido: false, motivo: 'Usuário do token não existe mais.' };
    return { valido: true, email: data.email, data };
}

function gerarTokenRecuperacao(email) {
    const token = gerarToken();
    const data = {
        token,
        email: email.trim().toLowerCase(),
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 min
        criadoEm: Date.now()
    };
    setResetData(data);
    return data;
}

async function redefinirSenha(token, novaSenha) {
    const check = validarToken(token);
    if (!check.valido) return { ok: false, erro: check.motivo };
    if (!validarSenha(novaSenha)) return { ok: false, erro: 'A nova senha deve ter no mínimo 8 caracteres.' };
    const usuarios = getUsuarios();
    const idx = usuarios.findIndex(u => u.email.toLowerCase() === check.email.toLowerCase());
    if (idx === -1) return { ok: false, erro: 'Usuário não encontrado.' };
    const novoHash = await hashSenha(novaSenha);
    usuarios[idx].senhaHash = novoHash;
    // remove campo legado senha em texto puro se existir
    delete usuarios[idx].senha;
    setUsuarios(usuarios);
    // invalida token após uso
    localStorage.removeItem(RESET_KEY);
    return { ok: true };
}

// ---------- Login helper ----------

async function fazerLogin(email, senha) {
    const user = buscarUsuario(email);
    if (!user) return { ok: false, erro: 'E-mail não cadastrado.' };
    const hash = await hashSenha(senha);
    // compat: usuários antigos podem ter `senha` em texto puro ou `senhaHash`
    const storedHash = user.senhaHash || null;
    const storedPlain = user.senha || null;
    let match = false;
    if (storedHash) {
        match = storedHash === hash;
    } else if (storedPlain) {
        // migra checando texto puro (apenas para compatibilidade)
        if (storedPlain === senha) {
            match = true;
            // migra para hash silenciosamente
            user.senhaHash = hash;
            delete user.senha;
            const usuarios = getUsuarios();
            const idx = usuarios.findIndex(u => u.id === user.id);
            if (idx !== -1) { usuarios[idx] = user; setUsuarios(usuarios); }
        } else {
            // tenta comparar hash do plain também (caso já tenha sido hasheado sem saber)
            const plainHash = await hashSenha(storedPlain);
            match = plainHash === hash || storedPlain === senha;
        }
    }
    if (!match) return { ok: false, erro: 'Senha incorreta.' };
    setCurrentUser(user);
    return { ok: true, user };
}

// ---------- UI helpers ----------

function showFeedback(msg, tipo = 'error') {
    const el = document.getElementById('auth-feedback');
    if (!el) return;
    el.textContent = msg;
    el.className = `auth-feedback show auth-feedback--${tipo}`;
    el.style.display = ''; // deixa CSS controlar via .show
    // scroll suave até feedback em mobile
    try { el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch {}
}

function clearFeedback() {
    const el = document.getElementById('auth-feedback');
    if (!el) return;
    el.textContent = '';
    el.className = 'auth-feedback';
    el.style.display = 'none';
}

function showFieldError(id, msg) {
    const err = document.getElementById(id);
    const inputId = id.replace('erro-', '').replace('erro_', '');
    // mapeia ids: erro-nome -> nome, erro-confirmar -> confirmar-senha etc.
    const map = {
        'erro-nome': 'nome',
        'erro-email': 'email',
        'erro-senha': 'senha',
        'erro-confirmar': 'confirmar-senha',
        'erro-termos': 'termos',
        'erro-nova': 'nova-senha',
        'erro-confirmar-nova': 'confirmar-nova'
    };
    const input = document.getElementById(map[id] || inputId);
    if (err) {
        err.textContent = msg || '';
        err.classList.toggle('show', !!msg);
    }
    if (input) {
        input.classList.toggle('input--error', !!msg);
        if (msg) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
    }
}

function clearFieldErrors() {
    document.querySelectorAll('.field-error').forEach(e => {
        e.textContent = '';
        e.classList.remove('show');
    });
    document.querySelectorAll('.input').forEach(i => {
        i.classList.remove('input--error', 'input--success');
        i.removeAttribute('aria-invalid');
    });
}

function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const txt = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    btn.disabled = loading;
    if (txt) txt.style.opacity = loading ? '0.0' : '1';
    if (loader) loader.style.display = loading ? 'inline-block' : 'none';
    btn.style.position = 'relative';
    if (loader) {
        loader.style.position = 'absolute';
        loader.style.left = '50%';
        loader.style.top = '50%';
        loader.style.transform = 'translate(-50%,-50%)';
    }
}

function shakeCard() {
    const card = document.querySelector('.auth-card');
    if (!card) return;
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
    setTimeout(() => card.classList.remove('shake'), 500);
}

function configurarToggleSenha() {
    document.querySelectorAll('.toggle-pass').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (!input) return;
            const isPass = input.type === 'password';
            input.type = isPass ? 'text' : 'password';
            btn.setAttribute('aria-label', isPass ? 'Ocultar senha' : 'Mostrar senha');
            const open = btn.querySelector('.eye-open');
            const closed = btn.querySelector('.eye-closed');
            if (open) open.style.display = isPass ? 'none' : 'block';
            if (closed) closed.style.display = isPass ? 'block' : 'none';
        });
    });
}

// ---------- Handlers por página ----------

async function handleCadastro(e) {
    e.preventDefault();
    clearFeedback();
    clearFieldErrors();
    const nome = document.getElementById('nome')?.value || '';
    const email = document.getElementById('email')?.value || '';
    const senha = document.getElementById('senha')?.value || '';
    const confirmar = document.getElementById('confirmar-senha')?.value || '';
    const termos = document.getElementById('termos')?.checked || false;

    let hasError = false;

    if (!nome.trim()) {
        showFieldError('erro-nome', 'Informe seu nome completo.');
        hasError = true;
    }
    if (!email.trim()) {
        showFieldError('erro-email', 'Informe seu e-mail.');
        hasError = true;
    } else if (!validarEmail(email.trim())) {
        showFieldError('erro-email', 'E-mail inválido. Ex: voce@exemplo.com');
        hasError = true;
    } else if (ADMIN_USERS.some(a => a.email.toLowerCase() === email.trim().toLowerCase())) {
        showFieldError('erro-email', 'Este e-mail é reservado.');
        hasError = true;
    } else if (buscarUsuario(email)) {
        showFieldError('erro-email', 'Este e-mail já está cadastrado. Tente fazer login.');
        hasError = true;
    }
    if (!senha) {
        showFieldError('erro-senha', 'Crie uma senha.');
        hasError = true;
    } else if (!validarSenha(senha)) {
        showFieldError('erro-senha', 'Senha deve ter no mínimo 8 caracteres.');
        hasError = true;
    }
    if (!confirmar) {
        showFieldError('erro-confirmar', 'Confirme sua senha.');
        hasError = true;
    } else if (senha !== confirmar) {
        showFieldError('erro-confirmar', 'As senhas não coincidem.');
        hasError = true;
    }
    if (!termos) {
        showFieldError('erro-termos', 'Você precisa aceitar os termos para continuar.');
        hasError = true;
    }

    if (hasError) {
        showFeedback('Corrija os campos destacados e tente novamente.', 'error');
        shakeCard();
        return;
    }

    setLoading('btn-cadastro', true);
    try {
        const hash = await hashSenha(senha);
        salvarUsuario({ nome, email, senhaHash: hash });
        showFeedback('Conta criada com sucesso! Redirecionando para o login...', 'success');
        // feedback visual nos inputs
        document.getElementById('nome')?.classList.add('input--success');
        document.getElementById('email')?.classList.add('input--success');
        e.target.reset();
        setTimeout(() => {
            window.location.href = 'login.html?cadastrado=1';
        }, 1400);
    } catch (err) {
        showFeedback('Erro ao criar conta. Tente novamente.', 'error');
        shakeCard();
    } finally {
        setLoading('btn-cadastro', false);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    clearFeedback();
    clearFieldErrors();
    const email = document.getElementById('email')?.value || '';
    const senha = document.getElementById('senha')?.value || '';
    const lembrar = document.getElementById('lembrar')?.checked || false;

    let hasError = false;
    if (!email.trim()) {
        showFieldError('erro-email', 'Informe seu e-mail.');
        hasError = true;
    } else if (!validarEmail(email.trim())) {
        showFieldError('erro-email', 'E-mail inválido.');
        hasError = true;
    }
    if (!senha) {
        showFieldError('erro-senha', 'Informe sua senha.');
        hasError = true;
    }
    if (hasError) {
        showFeedback('Preencha todos os campos obrigatórios.', 'error');
        shakeCard();
        return;
    }

    setLoading('btn-login', true);
    try {
        const res = await login(email, senha);
        if (!res.ok) {
            if (res.erro.includes('não cadastrado')) {
                showFieldError('erro-email', res.erro);
            } else if (res.erro.includes('Senha')) {
                showFieldError('erro-senha', res.erro);
            }
            showFeedback(res.erro + ' Verifique ou crie uma conta.', 'error');
            shakeCard();
            return;
        }
        if (lembrar) {
            try { localStorage.setItem('techstore_remember_email', email.trim().toLowerCase()); } catch {}
        } else {
            try { localStorage.removeItem('techstore_remember_email'); } catch {}
        }
        const primeiro = res.user.nome.split(' ')[0];
        if (res.isAdmin || isAdmin()) {
            showFeedback(`Bem-vindo, Administrador! Redirecionando ao painel...`, 'success');
            setTimeout(() => { window.location.href = 'admin/index.html'; }, 900);
        } else {
            showFeedback(`Bem-vindo, ${primeiro}! Redirecionando...`, 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 900);
        }
    } finally {
        setLoading('btn-login', false);
    }
}

async function handleEsqueci(e) {
    e.preventDefault();
    clearFeedback();
    clearFieldErrors();
    const email = document.getElementById('email')?.value || '';
    if (!email.trim()) {
        showFieldError('erro-email', 'Informe seu e-mail.');
        showFeedback('Informe o e-mail cadastrado.', 'error');
        shakeCard();
        return;
    }
    if (!validarEmail(email.trim())) {
        showFieldError('erro-email', 'E-mail inválido.');
        showFeedback('Verifique o formato do e-mail.', 'error');
        shakeCard();
        return;
    }
    const user = buscarUsuario(email);
    if (!user) {
        showFieldError('erro-email', 'E-mail não encontrado.');
        showFeedback('Este e-mail não está cadastrado. Crie uma conta.', 'error');
        shakeCard();
        return;
    }

    setLoading('btn-esqueci', true);
    try {
        // simula delay de geração
        await new Promise(r => setTimeout(r, 500));
        const data = gerarTokenRecuperacao(email);
        showFeedback('Link de recuperação gerado! (demonstração — nenhum e-mail real foi enviado)', 'success');
        const box = document.getElementById('recuperacao-sucesso');
        const tokenEl = document.getElementById('demo-token');
        if (box) box.style.display = 'grid';
        if (tokenEl) tokenEl.textContent = data.token;
        // opcional: já deixa email marcado visualmente como sucesso
        document.getElementById('email')?.classList.add('input--success');
    } finally {
        setLoading('btn-esqueci', false);
    }
}

async function handleRedefinir(e) {
    e.preventDefault();
    clearFeedback();
    clearFieldErrors();
    const nova = document.getElementById('nova-senha')?.value || '';
    const confirmar = document.getElementById('confirmar-nova')?.value || '';
    const data = getResetData();

    // valida token antes de senha
    const token = data?.token || null;
    const infoEl = document.getElementById('token-info');

    function renderTokenInfo() {
        if (!infoEl) return;
        if (!data) {
            infoEl.textContent = 'Nenhum link de recuperação encontrado. Volte em "Esqueci minha senha" e gere um novo.';
            infoEl.className = 'token-info show token-info--invalid';
            return false;
        }
        const check = validarToken(data.token);
        if (!check.valido) {
            infoEl.textContent = check.motivo;
            infoEl.className = 'token-info show token-info--invalid';
            return false;
        }
        const mins = Math.max(0, Math.ceil((data.expiresAt - Date.now()) / 60000));
        infoEl.textContent = `Link válido para: ${check.email} • expira em ~${mins} min • Token: ${data.token.slice(0, 12)}…`;
        infoEl.className = 'token-info show token-info--valid';
        return true;
    }

    const tokenValido = renderTokenInfo();
    if (!tokenValido) {
        showFeedback('Token inválido ou expirado. Gere um novo link.', 'error');
        shakeCard();
        return;
    }

    let hasError = false;
    if (!nova) {
        showFieldError('erro-nova', 'Informe a nova senha.');
        hasError = true;
    } else if (!validarSenha(nova)) {
        showFieldError('erro-nova', 'Mínimo 8 caracteres.');
        hasError = true;
    }
    if (!confirmar) {
        showFieldError('erro-confirmar-nova', 'Confirme a nova senha.');
        hasError = true;
    } else if (nova !== confirmar) {
        showFieldError('erro-confirmar-nova', 'As senhas não coincidem.');
        hasError = true;
    }
    if (hasError) {
        showFeedback('Corrija os campos destacados.', 'error');
        shakeCard();
        return;
    }

    setLoading('btn-redefinir', true);
    try {
        const res = await redefinirSenha(token, nova);
        if (!res.ok) {
            showFeedback(res.erro, 'error');
            if (infoEl) {
                infoEl.textContent = res.erro;
                infoEl.className = 'token-info show token-info--invalid';
            }
            shakeCard();
            return;
        }
        showFeedback('Senha redefinida com sucesso! Redirecionando para login...', 'success');
        e.target.reset();
        if (infoEl) {
            infoEl.textContent = 'Senha atualizada. Token invalidado. Use sua nova senha para entrar.';
            infoEl.className = 'token-info show token-info--valid';
        }
        setTimeout(() => window.location.href = 'login.html?redefinido=1', 1400);
    } finally {
        setLoading('btn-redefinir', false);
    }
}

// ---------- Inicialização ----------

document.addEventListener('DOMContentLoaded', () => {
    configurarToggleSenha();

    // preenche "lembrar" se existir
    const rememberEmail = (() => { try { return localStorage.getItem('techstore_remember_email'); } catch { return null; }})();
    const loginEmailInput = document.getElementById('email');
    const lembrarChk = document.getElementById('lembrar');
    // apenas em login.html (tem #lembrar)
    if (rememberEmail && lembrarChk && loginEmailInput && document.getElementById('login-form')) {
        loginEmailInput.value = rememberEmail;
        lembrarChk.checked = true;
    }

    // banners via query param (cadastro/redefinido)
    const params = new URLSearchParams(window.location.search);
    if (params.get('cadastrado') === '1' && document.getElementById('login-form')) {
        showFeedback('Conta criada! Faça login com suas credenciais.', 'success');
    }
    if (params.get('redefinido') === '1' && document.getElementById('login-form')) {
        showFeedback('Senha redefinida! Entre com a nova senha.', 'success');
    }

    // bind forms
    const cadastroForm = document.getElementById('cadastro-form');
    const loginForm = document.getElementById('login-form');
    const esqueciForm = document.getElementById('esqueci-form');
    const redefinirForm = document.getElementById('redefinir-form');

    if (cadastroForm) cadastroForm.addEventListener('submit', handleCadastro);
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (esqueciForm) esqueciForm.addEventListener('submit', handleEsqueci);
    if (redefinirForm) redefinirForm.addEventListener('submit', handleRedefinir);

    // redefinir: mostra info do token ao carregar
    if (redefinirForm) {
        const data = getResetData();
        const infoEl = document.getElementById('token-info');
        if (infoEl) {
            if (!data) {
                infoEl.textContent = 'Nenhum link encontrado. Gere um novo em "Esqueci minha senha".';
                infoEl.className = 'token-info show token-info--invalid';
            } else {
                const check = validarToken(data.token);
                if (!check.valido) {
                    infoEl.textContent = check.motivo;
                    infoEl.className = 'token-info show token-info--invalid';
                } else {
                    const mins = Math.max(0, Math.ceil((data.expiresAt - Date.now()) / 60000));
                    infoEl.textContent = `Link válido para ${check.email} — expira em ~${mins} min.`;
                    infoEl.className = 'token-info show token-info--valid';
                }
            }
        }
        // se veio com token explicito na URL (opcional), valida
        const tParam = params.get('token');
        if (tParam && data && tParam !== data.token) {
            if (infoEl) {
                infoEl.textContent = 'Token da URL não coincide com o armazenado. Use o fluxo via "Esqueci minha senha".';
                infoEl.className = 'token-info show token-info--invalid';
            }
        }
    }

    // esqueci: se já tem token válido, mostra box direto
    if (esqueciForm) {
        const data = getResetData();
        if (data) {
            const check = validarToken(data.token);
            if (check.valido) {
                const box = document.getElementById('recuperacao-sucesso');
                const tokenEl = document.getElementById('demo-token');
                if (box && tokenEl) {
                    // não mostra automaticamente para não confundir; apenas deixa pronto
                    // mas se usuário recarregar após gerar, mantém feedback
                    // showFeedback('Você já possui um link válido. Se expirou, gere outro.', 'info');
                }
            }
        }
    }

    // limpa erros ao digitar
    document.querySelectorAll('.input').forEach(inp => {
        inp.addEventListener('input', () => {
            inp.classList.remove('input--error');
            const errId = 'erro-' + inp.id.replace('confirmar-senha', 'confirmar').replace('nova-senha', 'nova').replace('confirmar-nova', 'confirmar-nova');
            // tentativa genérica: procura erro próximo
            const field = inp.closest('.field');
            const err = field ? field.querySelector('.field-error') : null;
            if (err) { err.textContent = ''; err.classList.remove('show'); }
            // também limpa erro específico mapeado
            const specific = document.getElementById(errId);
            if (specific) { specific.textContent = ''; specific.classList.remove('show'); }
        });
    });

    // checkbox termos: limpa erro ao clicar
    const termosChk = document.getElementById('termos');
    if (termosChk) termosChk.addEventListener('change', () => {
        const e = document.getElementById('erro-termos');
        if (e) { e.textContent = ''; e.classList.remove('show'); }
    });
});

// Expõe para integração com index.html/store e admin
window.isAdmin = isAdmin;
window.protegerPaginaAdmin = protegerPaginaAdmin;
window.login = login;
window.TechStoreAuth = {
    getCurrentUser,
    logout,
    buscarUsuario,
    validarEmail,
    validarSenha,
    hashSenha,
    fazerLogin,
    login,
    isAdmin,
    protegerPaginaAdmin,
    gerarToken,
    validarToken,
    redefinirSenha
};
