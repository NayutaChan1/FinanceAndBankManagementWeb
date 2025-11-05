import { Link } from "react-router-dom"
import '../Css/RegisterPage.css'
import { useState } from "react"
import image from '../assets/unnamed.jpg'
import { authService } from '../services/authService'

function RegisterPage() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleregister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const result = await authService.register(email, username, password);
            console.log("Registration success", result);
            setSuccess('Registration successful!');
            setEmail('');
            setUsername('');
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            const error = err as Error;
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    return(
        <div className='All-Container'>
            <div className='Image-left'>
                <img src={image} alt="" className='Image'/>
                <h2 style={{color: 'white', textAlign: 'center', fontFamily: 'Montserrat', fontSize: '32px', fontWeight: '600'}}>
                    Manage your Finance
                </h2>
            </div>
            <div className='Registerform-right'>
                <div className='BoxRegister'>
                    <div className='Title'>
                        Register
                    </div>
                    <form onSubmit={handleregister}>
                        <div className='EmailSection'>
                            <div className='Email-Text'>
                                Email
                            </div>
                            <div className='Email-Textfield'>
                                <input 
                                type='email' 
                                className='textfield' 
                                placeholder='Enter your email'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                />
                            </div>
                        </div>
                        <div className='UsernameSection'>
                            <div className='Username-Text'>
                                Username
                            </div>
                            <div className='Username-Textfield'>
                                <input 
                                type='text' 
                                className='textfield' 
                                placeholder='Enter your username'
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
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
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                />
                            </div>
                        </div>
                        <div className='ConfirmPasswordSection'>
                            <div className='Password-Text'>
                                Confirm Password
                            </div>
                            <div className='Password-Textfield'>
                                <input 
                                type='password' 
                                className='textfield' 
                                placeholder='Confirm your password'
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                />
                            </div>
                        </div>
                        {error && <div style={{color: 'red', textAlign: 'center', marginBottom: '10px'}}>{error}</div>}
                        {success && <div style={{color: 'green', textAlign: 'center', marginBottom: '10px'}}>{success}</div>}
                        <div className='Register-Button'>
                            <button type="submit" disabled={loading}>
                                {loading ? 'Registering...' : 'Register'}
                            </button>
                        </div>
                    </form>
                    <Link to="/" className='GoToLogin'>
                        Already Have an Account?, Click Here 
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default RegisterPage