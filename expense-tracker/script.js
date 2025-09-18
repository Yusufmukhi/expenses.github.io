// Login / Signup + Remember Me
(function(){
  // tab switching
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  loginTab.onclick = () => { loginForm.classList.remove('hidden'); signupForm.classList.add('hidden'); loginTab.classList.add('active'); signupTab.classList.remove('active'); }
  signupTab.onclick = () => { signupForm.classList.remove('hidden'); loginForm.classList.add('hidden'); signupTab.classList.add('active'); loginTab.classList.remove('active'); }

  // signup
  signupForm.onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim().toLowerCase();
    const password = document.getElementById('signupPassword').value;
    if(!name || !email || !password){ alert('Fill all fields'); return; }
    const user = { name, email, password };
    localStorage.setItem('user', JSON.stringify(user));
    alert('Signup successful. Login now.');
    signupForm.reset();
    loginTab.click();
  };

  // login
  loginForm.onsubmit = (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const remember = document.getElementById('rememberMe').checked;
    const stored = JSON.parse(localStorage.getItem('user'));
    if(!stored || stored.email !== email || stored.password !== password){
      alert('Invalid credentials');
      return;
    }
    if(remember) localStorage.setItem('rememberMe', 'true');
    else localStorage.removeItem('rememberMe');
    localStorage.setItem('loggedIn', 'true');
    window.location.href = 'dashboard.html';
  };

  // auto redirect if remembered and user exists
  if(localStorage.getItem('rememberMe') === 'true' && localStorage.getItem('user')){
    localStorage.setItem('loggedIn','true');
    window.location.href = 'dashboard.html';
  }
})();
