const API_BASE = 'http://localhost:5555'

export const authService = {
    async login(email : string, password : string) {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json',
            },
            body: JSON.stringify({email, password}),
        });

        if(!response.ok){
            throw new Error('Login Failed');
        }

        return response.json();
    },

    async register(email : string, username : string, password : string) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, username, password }),
    });
    
    if (!response.ok) {
      throw new Error('Registration failed');
    }
    
    return response.json();
  }
}