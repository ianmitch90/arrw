import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-4">
      <div>
        <h6>
          &copy; {new Date().getFullYear()} Dating App. All rights reserved.
        </h6>
      </div>
    </footer>
  );
};

export default Footer;
