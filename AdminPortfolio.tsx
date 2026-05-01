import { useState } from 'react';
import { Tab } from '@headlessui/react';
import { Toast } from 'sonner';

const AdminPortfolio = () => {
    const [files, setFiles] = useState([]);
    const [individualFile, setIndividualFile] = useState(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');

    const handleBulkUpload = (event) => {
        const uploadedFiles = Array.from(event.target.files);
        setFiles(uploadedFiles);
        Toast.success('Bulk upload successful!');
    };

    const handleIndividualUpload = () => {
        // Handle individual upload
        if (individualFile) {
            // Logic for individual file upload
            Toast.success('Individual upload successful!');
        }
    };

    const handleDelete = (index) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        Toast.success('File deleted!');
    };

    return (
        <div className="container mx-auto p-4">
            <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
                    <Tab className={({ selected }) => selected ? 'tab-active' : 'tab-inactive'}>Bulk Upload</Tab>
                    <Tab className={({ selected }) => selected ? 'tab-active' : 'tab-inactive'}>Individual Upload</Tab>
                </Tab.List>
                <Tab.Panels>
                    <Tab.Panel className="tab-panel">
                        <input type="file" multiple onChange={handleBulkUpload} />
                        <div>
                            {files.map((file, index) => (
                                <div key={index} className="file-preview">
                                    <span>{file.name}</span>
                                    <button onClick={() => handleDelete(index)}>Delete</button>
                                </div>
                            ))}
                        </div>
                    </Tab.Panel>
                    <Tab.Panel className="tab-panel">
                        <input type="file" onChange={e => setIndividualFile(e.target.files[0])} />
                        <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
                        <input type="text" placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
                        <button onClick={handleIndividualUpload}>Upload Individual Item</button>
                    </Tab.Panel>
                </Tab.Panels>
            </Tab.Group>
        </div>
    );
};

export default AdminPortfolio;