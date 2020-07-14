const changePage = (page) => {
  const pages = ['welcome', 'dashboard', 'info', 'refresh']
  if (!pages.includes(page)) page = 'welcome'
  const views = [...document.querySelectorAll('.page .view')]
  views.forEach((view) => {
    if (view.getAttribute('id') === page) {
      view.setAttribute('active', '')
    } else {
      view.removeAttribute('active')
    }
  })
  window.location.hash = page
}

const openDashboard = () => {
  const win = window.open('https://developer.spotify.com/dashboard/applications', '_blank')
  win.focus()
  changePage('info')
}

const scopesOptions = [
  'ugc-image-upload',
  'playlist-read-collaborative',
  'playlist-modify-private',
  'playlist-modify-public',
  'playlist-read-private',
  'user-read-playback-position',
  'user-read-recently-played',
  'user-top-read',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-read-private',
  'user-read-email',
  'user-library-modify',
  'user-library-read',
  'user-follow-modify',
  'user-follow-read',
  'streaming',
  'app-remote-control',
]

scopesOptions.forEach((scope) => {
  const html = `
    <label class="input">
      <input type="checkbox" name="scope" value="${scope}">
      ${scope}
    </label>
  `
  document.querySelector('.scope-checkbox').innerHTML += html
})

const getAcccessCode = () => {
  const clientId = document.querySelector('input#clientId').value
  const clientSecret = document.querySelector('input#clientSecret').value
  const redirectUrl = document.querySelector('input#redirectUri').value
  const scopesInput = [...document.querySelectorAll('.scope-checkbox input')]
  const scopes = scopesInput
    .map((input) => input.checked && input.value)
    .filter((input) => input)
    .join(' ')
  if (!clientId || !clientSecret || !redirectUrl || !scopes) return
  let url = 'https://accounts.spotify.com/authorize'
  url += '?response_type=code'
  url += `&client_id=${encodeURIComponent(clientId)}`
  url += `&scope=${encodeURIComponent(scopes)}`
  url += `&redirect_uri=${encodeURIComponent(redirectUrl)}`
  localStorage.setItem('clientId', clientId)
  localStorage.setItem('clientSecret', clientSecret)
  localStorage.setItem('redirectUrl', redirectUrl)
  localStorage.setItem('scopes', scopes)
  window.location.href = url
}

const getRefreshToken = async (code) => {
  const clientId = localStorage.getItem('clientId')
  const clientSecret = localStorage.getItem('clientSecret')
  const redirectUrl = localStorage.getItem('redirectUrl')
  clearLocalStorage()

  const data = {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: redirectUrl,
    code
  }

  let formBody = []
  for (let key in data) {
    const encodedKey = encodeURIComponent(key)
    const encodedValue = encodeURIComponent(data[key])
    formBody.push(encodedKey + "=" + encodedValue)
  }
  formBody = formBody.join("&")

  const request = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formBody
  })

  if (request.status !== 200) {
    changePage('info')
    return
  }
  const response = await request.json()
  document.querySelector('.refresh-token').value = response.refresh_token
}

const clearLocalStorage = () => {
  localStorage.removeItem('clientId')
  localStorage.removeItem('clientSecret')
  localStorage.removeItem('redirectUrl')
  localStorage.removeItem('scopes')
}

(async function() {
  document.querySelector('.dashboard-url').textContent = location.origin
  document.querySelector('input#redirectUri').value = location.origin
  const clientId = localStorage.getItem('clientId')
  const clientSecret = localStorage.getItem('clientSecret')
  const redirectUrl = localStorage.getItem('redirectUrl')
  const scopes = localStorage.getItem('scopes')
  if (clientId && clientSecret && redirectUrl && scopes) {
    document.querySelector('input#clientId').value = clientId
    document.querySelector('input#clientSecret').value = clientSecret
    document.querySelector('input#redirectUri').value = redirectUrl
    scopes.split(' ').forEach((scope) => {
      const checkbox = document.querySelector(`.scope-checkbox input[value="${scope}"]`)
      checkbox.checked = true
    })
  }

  let searchParams = new URLSearchParams(location.search)
  const accessCode = searchParams.get('code')
  if (accessCode) {
    searchParams.set('code', '');
    window.history.replaceState({}, '', `${location.pathname}`);
    changePage('refresh')
    await getRefreshToken(accessCode)
  } else {
    const hash = window.location.hash.substring(1)
    changePage(hash || 'welcome')
    if (hash === 'info') return
    clearLocalStorage()
  }
}());

