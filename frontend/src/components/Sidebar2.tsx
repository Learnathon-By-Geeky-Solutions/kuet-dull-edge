import Link from 'next/link'
import React from 'react'
import ThemeSwitcher from './ThemeSwitcher'

const Sidebar2 = () => {
    return (
        <>
            <label htmlFor="my-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
            <ul className="menu bg-base-300 z-index-100 text-base-content min-h-full w-80 p-4">
                {/* <li><Link href={'/rooms'}>Dashbaord</Link></li> */}
                <li>
                    <details className="collapse collapse-arrow">
                        <summary className="collapse-title">Rooms</summary>
                        <div className="collapse-content">
                            <ul>
                                <li>CSE 21</li>
                                <li>Bit2Byte</li>
                                <li>SGIPC</li>
                            </ul>
                        </div>
                    </details>
                </li>
                <li><Link href={'/notes'}>Notes</Link></li>
                <li><Link href={'/class-chat'}>Class Chat</Link></li>
                <li><Link href={'/chatbot'}>Chatbot</Link></li>
                <li><Link href={'/settings'}>Settings</Link></li>
                <div><ThemeSwitcher /></div>
            </ul>
        </>
    )
}

export default Sidebar2