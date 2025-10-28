import { Link } from "react-router-dom"
import '../Css/RegisterPage.css'
import { useState } from "react"
import image from '../assets/unnamed.jpg'

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleregister = () => {
        console.log("Username : " + username)
        console.log("Password : " + password)
        console.log("Confirm Passowrd : " + confirmPassword)
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
                            onChange={(e) => setPassword(e.target.value)}
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
                            />
                        </div>
                    </div>
                    <div className='Register-Button'>
                        <button onClick={handleregister}>Register</button>
                    </div>
                    <Link to="/" className='GoToLogin'>
                        Already Have an Account?, Click Here 
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default RegisterPage