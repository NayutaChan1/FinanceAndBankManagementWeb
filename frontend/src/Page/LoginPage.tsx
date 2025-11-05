import { useState } from 'react';
import '../Css/LoginPage.css'
import { Link, useNavigate } from 'react-router-dom'
import image from '../assets/unnamed.jpg'
import { authService } from '../services/authService';

function LoginPage(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handlelogin = async (e : React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const result = await authService.login(username, password);
            console.log("Login success", result);
            localStorage.setItem('token', result.access_token);
            navigate('/dashboard')
        } catch (err) {
            const error2 = err as Error;
            setError(error2.message);
            console.log(`Error : ${error}`)
        } finally {
            setLoading(false);
        }
        // console.log(username)
        // console.log(password)
    }

    return(
        <div className='All-Container'>
            <div className='Image-left'>
                <img src={image} alt="" className='Image'/>
                <h2 style={{color: 'white', textAlign: 'center', fontFamily: 'Montserrat', fontSize: '32px', fontWeight: '600'}}>
                    Manage your Finance
                </h2>
            </div>
            <div className='Loginform-right'>
                <div className='BoxLogin'>
                    <div className='Title'>
                        Login
                    </div>
                    <form onSubmit={handlelogin}>
                        <div className='UsernameSection'>
                        <div className='Username-Text'>
                            Email
                        </div>
                        <div className='Username-Textfield'>
                            <input 
                            type='text' 
                            className='textfield' 
                            placeholder='Enter your email'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        </div>
                        <div className='PasswordSection'>
                            <div className='Password-Text'>
                                Password
                            </div>
                            <div className='Password-Textfield'>
                                <input 
                                type='password' 
                                className='textfield' 
                                placeholder='Enter your password'
                                value={password}
                                onChange={(e) => {setPassword(e.target.value)}}
                                />
                            </div>
                        </div>
                        <div className='Login-Button'>
                            <button type='submit' disabled={loading}>
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </div>
                    </form>
                    <Link to="register" className='GoToRegister'>
                        Don't Have an Account?, Click Here  
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default LoginPage