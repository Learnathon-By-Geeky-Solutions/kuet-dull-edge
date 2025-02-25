import React, { useEffect, useRef } from 'react';

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const sidebarRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    return (
        <div className={`fixed inset-0 bg-base-100 bg-opacity-50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} z-100`}> 
            <div ref={sidebarRef} className={`fixed top-0 left-0 w-64 bg-base-100 shadow-lg shadow-base-600 h-full transition-transform transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}> 
                {/* <button onClick={onClose} className="p-2">Close</button> */}
                <div className='h-full w-full flex flex-col gap-2'>
                    <div>Dashbaord</div>
                    <div>Notes</div>
                    <div>Class Chat</div>
                    <div>Chatbot</div>
                    <div>Settings</div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;