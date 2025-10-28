import { useState } from 'react';
import '../Css/LoginPage.css'
import { Link } from 'react-router-dom'
import image from '../assets/unnamed.jpg'

function LoginPage(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handlelogin = () => {
        console.log(username)
        console.log(password)
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
                        <button onClick={handlelogin}>Login</button>
                    </div>
                    <Link to="register" className='GoToRegister'>
                        Don't Have an Account?, Click Here  
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default LoginPage