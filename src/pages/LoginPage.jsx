import React from "react";
import LogoWhite from "../component/LogoWhite";
import "../css/pages.css";

export default function LoginPage() {
    return (
    <div className="login-page">
        <div className="logo-container">
            <LogoWhite />
        </div>
        <div className="cover-img">
        </div>
        <div className="welcome-text">
            <h1>Welcome to RMIT Library</h1>
            <p>Read, browse and expand your knowledge</p>
        </div>
        <div className="content-container">
        <div className="login-form">
            <h2 className="Title">Sign In</h2>
            <form className="form">
                <div>
                    <input type="text" id="username" name="username" required placeholder="Username" />
                </div>
                <div>
                    <input type="password" id="password" name="password" required placeholder="Password" />
                </div>
                <button type="submit" id="login-btn">Login</button>
            </form>
        </div>
        </div>
    </div>
    );
}