import React from 'react';
import googleImg from '../../../../public/img/google.svg';
import githubImg from '../../../../public/img/github.svg';
import facebootImg from '../../../../public/img/facebook.svg';
import Image from 'next/image';
import Link from 'next/link';

const SignupForm = () => {
    const hostInfo = 'You can use the custom server options to sign into other Matrix servers by specifying a different homeserver URL. This allows you to use Element with an existing Matrix account on a different homeserver.';
    return (
        <div className='flex w-full flex-col'>
            <h1 className="text-2xl font-bold text-start mb-6">Create account</h1>

            <div className="form-control">
                <label className="label justify-between">
                    <span className="label-text ">Host account on</span>
                    <div className="tooltip" data-tip={hostInfo}>
                        <button className="btn btn-ghost btn-circle ">?</button>
                    </div>
                </label>
                <select className="select select-bordered">
                <option>Iilish</option>
                <option>Chanachur</option>
                </select>
            </div>
            <div className='my-5 divider'></div>

            <div className="flex w-full flex-col lg:flex-row">

                <div className=" rounded-box grid h-full flex-grow place-items-center">
                    <div className="form-control mt-2 w-full">
                        <label className="label">
                            <span className="label-text">Username</span>
                        </label>
                        <input type="text" className="input input-bordered" />
                    </div>

                    <div className="form-control mt-2 w-full">
                        <label className="label">
                            <span className="label-text">Password</span>
                        </label>
                        <input type="password" className="input input-bordered" />
                    </div>

                    <div className="form-control mt-2">
                        <label className="label">
                            <span className="label-text">Email</span>
                        </label>
                        <input type="email" className="input input-bordered" />
                        <label className="label">
                            <span className="label-text-alt text-xs text-gray-500 mt-1">
                                Add an email to be able to reset your password. Use email to
                                optionally be discoverable by existing contacts.
                            </span>
                        </label>
                    </div>

                    <button className="btn btn-primary mt-6">Register</button>
                </div>

                <div className="divider lg:divider-horizontal"></div>

                <div className="rounded-box flex flex-col items-center justify-center">
                    <h5 className='text-center'>Continue with</h5>
                    <div className='flex flex-row items-center justify-center'>
                        <button className="btn btn-ghost btn-circle"><Image src={googleImg} alt="Google" /></button>
                        <button className="btn btn-ghost btn-circle"><Image src={facebootImg} alt='Facebook' /></button>
                        <button className="btn btn-ghost btn-circle"><Image src={githubImg} alt='Github' /></button>
                    </div>
                </div>
            </div>

            <div className="text-center mt-6 text-sm">
                Already have an account?{' '}
                <Link href="/signin" className="link link-primary">Sign in here</Link>
            </div>
            

        </div>
        // <div className="flex items-center justify-center p-4">
        //     <div className="p-5 w-full max-w-md bg-base-100 shadow-xl rounded-lg">
        //         <div className="">
        //             

        //             <div className="form-control">
        //                 <label className="label">
        //                     <span className="label-text">Username</span>
        //                 </label>
        //                 <input type="text" className="input input-bordered" />
        //             </div>

        //             <div className="form-control mt-4">
        //                 <label className="label">
        //                     <span className="label-text">Password</span>
        //                 </label>
        //                 <input type="password" className="input input-bordered" />
        //             </div>

        //             <div className="form-control mt-4">
        //                 <label className="label">
        //                     <span className="label-text">Email</span>
        //                 </label>
        //                 <input type="email" className="input input-bordered" />
        //                 <label className="label">
        //                     <span className="label-text-alt text-xs text-gray-500 mt-1">
        //                         Add an email to be able to reset your password. Use email to
        //                         optionally be discoverable by existing contacts.
        //                     </span>
        //                 </label>
        //             </div>

        //             <button className="btn btn-primary mt-6">Register</button>


        //             <div className="divider my-6">or</div>


        //             <h5 className='text-center'>Continue with</h5>
        //             <div className='flex flex-row items-center justify-center'>
        //                 <button className="btn btn-ghost btn-circle"><Image src={googleImg} alt="Google" /></button>
        //                 <button className="btn btn-ghost btn-circle"><Image src={facebootImg} alt='Facebook' /></button>
        //                 <button className="btn btn-ghost btn-circle"><Image src={githubImg} alt='Github' /></button>
        //             </div>


        //             <p className="text-center mt-4 text-sm">
        //                 Already have an account?{' '}
        //                 <Link href="/signin" className="link link-primary">Sign in here</Link>
        //             </p>

        //             <div className="text-center mt-6 text-sm text-gray-500">
        //                 English
        //             </div>
        //         </div>
        //     </div>
        // </div>
    );
};

export default SignupForm;