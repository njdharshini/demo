const express = require('express');
const authorization = require('../functions/auth');
const Customer = require('../models/Customer');
const { encryptIDs, decryptIDs } = require('../functions/utils');
const Organization = require('../models/Organization');
// const {encrypt}=require('../functions/encryption');
// const {decrypt}=require('../functions/decryption');

const router = express.Router();

//Add a labels 
router.post('/add',authorization, async (req, res) => {
    const { labels } = req.body;
    try {
        console.log(req.body);
        console.log("Workspace:", req.workspace);
        // Directly update the labels by email
        const updatedList = await Organization.findOneAndUpdate({
            workspace:req.workspace}, // Filter by the provided email
            { $addToSet: { labels: labels}},// Use $each to add multiple labels//update and avoid duplicates
            { new: true } // Return the updated document
        );
        console.log("list",updatedList);
        
        res.status(200).json(updatedList);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while updating labels' });
    }
});

//List the labels one user
router.post('/list', authorization,async (req, res) => {
    try {
        const labelList = await Organization.findOne(
            { workspace:req.workspace}, // Filter by the provided email
            { labels: 1, _id: 0 } // Include only the `labels` field, exclude `_id`
        );
        res.status(200).json(labelList);
    } catch (error) {
        console.error('Error fetching labels:', error);
        res.status(500).json({ error: 'An error occurred while fetching labels' });
    }
});

//Delete the labels 
router.post('/delete',authorization, async (req, res) => {
    const { labels } = req.body;
    console.log(req.body);
    

    try {
        const result = await Organization.updateOne(
            { workspace:req.workspace }, // Filter by the provided email
            { $pull: { labels:  labels  } }, // Pull labels matching any in the array
            { new: true } 
        );
        console.log(result);
        
        res.status(200).json({ message: 'Labels deleted from  documents',result });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while deleting the labels' });
    }
});

//Asign label
router.post('/assign-labels', authorization,async (req, res) => {
    const { customerIds,  label } = req.body;

    try {
        console.log(req.body);

        // Fetch the organization based on the workspace
        const organization = await Organization.findOne({ workspace:req.workspace });
        if (!organization) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        // // Check if the provided label exists in the organization's labels
        // if (!organization.labels.includes(label)) {
        //     return res.status(400).json({ message: 'The provided label does not exist in the organization' });
        // }

        // Encrypt the customer IDs
        const encryptedId = encryptIDs(customerIds);
        console.log(`Encrypted Data: ${encryptedId}`);

        // Update the database for all customer IDs
        const updateResult = await Customer.updateMany(
            { _id: { $in: customerIds } }, // Filter for customer IDs
            { $addToSet: { labels: label } }, // Add the single label to customers
            { new: true } // Option to return updated documents
        );

        // Extract matchedCount and modifiedCount from the MongoDB response
        // const { matchedCount, modifiedCount } = updateResult;

        // Respond with the encrypted IDs and update counts
        res.status(200).json({
            message: `Label  assigned successfully from organization`,
        });
    } catch (error) {
        console.error('Error assigning label:', error);
        res.status(500).json({ message: 'Error assigning label to customers', error: error.message });
    }
});

//decrypt
router.post('/decrypt-ids', async (req, res) => {
    const { encryptedId } = req.body;

    try {
        // Decrypt the encrypted ID
        const ids = decryptIDs(encryptedId);
        console.log('Decrypted IDs:', ids);

        // Respond with the original IDs
        res.status(200).json({
            message: 'IDs decrypted successfully',
            ids
        });
    } catch (error) {
        console.error('Error decrypting IDs:', error);
        res.status(500).json({ message: 'Error decrypting IDs', error: error.message });
    }
});

module.exports = router;












// // list
// router.post('/list_labels', async (req, res) => {
//     try {
//         // Use MongoDB aggregation to get all labels across all documents and remove duplicates
//         const labelList = await Organization.aggregate([
//             { $unwind: '$labels' }, // Flatten the labels arrays
//             { $group: { _id: null, uniqueLabels: { $addToSet: '$labels' } } }, // Get unique labels
//             { $project: { _id: 0, labels: '$uniqueLabels' } } // Return only unique labels, excluding _id
//         ]);

//         // Send the result
//         res.status(200).json(labelList);
//     } catch (error) {
//         console.error('Error fetching labels:', error);
//         res.status(500).json({ error: 'An error occurred while fetching labels' });
//     }
// });




// //Asign a label to multiple customer
// router.post('/add-labels', async (req, res) => {
//     const { labels, ids } = req.body;
//     console.log(req.body);

//     try {
//         // Encrypt each ID individually
//         const encryptedIds = ids.map((id) => {
//             const encrypted = encrypt(id);
//             return {
//                 encryptedData: encrypted.encryptedData, // Encrypted string
//                 iv: encrypted.iv // Initialization Vector
//             };
//         });

//         // Encrypt all IDs as a single string
//         const combinedIds = ids.join(','); // Combine all IDs into a single string
//         const combinedEncrypted = encrypt(combinedIds); // Encrypt the combined string
//         console.log(`Encrypted Data: ${combinedEncrypted.encryptedData}`);

//         // Update the database for all IDs
//         const updateResult = await Customer.updateMany(
//             { _id: { $in: ids } }, // Filter for IDs present in the `ids` array
//             { $addToSet: { labels: labels } }, // Add labels while avoiding duplicates
//             { new: true } // Option to include updated results if needed
//         );

//         // Extract matchedCount and modifiedCount from the MongoDB response
//         const { matchedCount, modifiedCount } = updateResult;

//         // Respond with encrypted IDs, combined encrypted ID, and update counts
//         res.status(200).json({
//             message: 'Labels added successfully',
//             EncryptedId: {
//                 encryptedData: combinedEncrypted.encryptedData,
//                 iv: combinedEncrypted.iv
//             }, // Combined encrypted ID
//             matchedCount, // Number of documents matched
//             modifiedCount // Number of documents updated
//         });
//     } catch (error) {
//         console.error('Error adding labels:', error);
//         res.status(500).json({ message: 'Error adding labels to IDs', error: error.message });
//     }
// });

// // Decryption Route
// router.post('/decrypt-labels', (req, res) => {
//     const { encryptedData } = req.body; // Encrypted data received

//     try {
//         // Decrypt the data using the decrypt function
//         const decryptedIds = decrypt(encryptedData); // Decrypt without IV (it is embedded in the encrypted data)

//         const decryptedIdArray = decryptedIds.split(',');

//         res.status(200).json({
//             message: 'Decryption successful',
//              decryptedIds: decryptedIdArray
//         });
//     } catch (error) {
//         console.error('Error decrypting:', error);
//         res.status(500).json({ message: 'Error decrypting the data', error: error.message });
//     }
// });













//decrypt output
// {
//     "encryptedIds": [
//         {
//             "encryptedData": "dbb0fb567015c876571afd17019b733cf5e7a5ea5aab5d2f05fa71aab1e3935e",
//             "iv": "3514f44cd15412f3a3826723d94c2e59"
//         },
//         {
//             "encryptedData": "7d54862e103ff3b57e885a72fc7c9b35add3b315573b982f538723a861b38942",
//             "iv": "06af54e3865c8ff259622ccb6e36ce34"
//         }
//     ]
// }






































// router.post('/decrypt-labels', async (req, res) => {
//     const {iv, encryptedIds } = req.body;  // Get the encrypted IDs from the request body

//     try {
        
//         // Decrypt each encrypted ID from the encryptedIds array using the default IV
//         const decryptedIds = encryptedIds.map((encryptedData,index) => {
//             // Decrypt using the provided encryptedId and default IV (not using IV from request body)
//             return decrypt(encryptedData.encryptedId,iv);  // Use the default IV
//         });

//         // Respond with the decrypted IDs
//         res.status(200).json({
//             message: 'Decrypted IDs successfully.',
//             decryptedIds  // The decrypted original IDs
//         });

//     } catch (error) {
//         console.error('Decryption error:', error);
//         res.status(500).json({ message: 'Error decrypting data', error: error.message });
//     }

// });














// router.post('/decrypt',async(req,res)=>{
//     const {encryptedData,iv} = req.body;
// try{
//     const decryptedData = decrypt(encryptedData,iv);
//     res.json({decryptedData});
// }catch(error){
//     console.error('Error decrypting data:', error);
//     res.status(500).json({ error: 'An error occurred while decrypting the data' });
// }
// });






































//correct code

// const { encrypt, decrypt } = require('../functions/encryption');

// // Add labels to multiple customers with encrypted IDs
// router.post('/addMul', verifyToken, async (req, res) => {
//     const { labels, encryptedIds } = req.body; // Receive encrypted IDs from the client

//     try {

//         // Decrypt IDs
//         const ids = encryptedIds.map((id) => {
//             try {
//                 return decrypt(id);
//             } catch (error) {
//                 console.error('Invalid encrypted ID:', id);
//                 throw new Error('Invalid encrypted ID format.');
//             }
//         });

//         // Update customers' labels
//         const updatedCustomers = await Customer.updateMany(
//             { _id: { $in: ids } }, // Match by decrypted IDs
//             { $addToSet: { labels: { $each: labels } } }, // Add labels, avoiding duplicates
//         );

//         res.status(200).json({ message: 'Labels added to customers', updatedCustomers });
//     } catch (error) {
//         console.error('Error adding labels to multiple customers:', error);
//         res.status(500).json({ message: 'An error occurred while adding labels', error: error.message });
//     }
// });




//Add a multiple customer to one label
// router.post('/addMul', verifyToken, async (req, res) => {
//     const { labels, id } = req.body;  // `labels` and `id` should be arrays
    
//     try {
//         console.log(req.body);
//         console.log("Email from token:", req.email);

//         // Update each customer's labels with the provided labels
//         const updatedCustomers = await Customer.updateMany(
//             {
//                 _id: { $in: id } // Match customers by their emails
//             },
//             {
//                 $addToSet: { labels:  labels  }  // Add each label and avoid duplicates
//             },
//             { new: true } // Return the updated customer documents
//         );

//         console.log("Updated Customers:", updatedCustomers);
//         res.status(200).json(updatedCustomers);
//     } catch (error) {
//         console.error("Error during updating labels:", error); // Log the actual error
//         res.status(500).json({ error: 'An error occurred while updating labels', details: error.message });
//     }
// });




// const {encrypt, decrypt} = require('../functions/encrypt');


// // Route: Add multiple labels to multiple customers (requires authentication)
// router.post('/addMul', verifyToken, async (req, res) => {
//     const { label, id } = req.body; // `id` is an array of unencrypted customer IDs

//     try {
//         console.log("Email from Token:", req.email);

//         // Encrypt IDs to match with `encryptedId` in the database
//         const encryptedIds = id.map(singleId => encrypt(singleId).content);
//         console.log("Encrypted IDs:", encryptedIds);

//         // Update customers by matching their encrypted IDs
//         const updatedCustomers = await Customer.updateMany(
//             {
//                 encryptedId: { $in: encryptedIds }, // Match encrypted IDs
//             },
//             {
//                 $addToSet: { labels: label }, // Add the label if it doesn't exist
//             }
//         );

//         // Log and respond with result
//         console.log("Updated Customers:", updatedCustomers);
//         res.status(200).json({
//             message: 'Labels added successfully',
//             updatedCount: updatedCustomers.modifiedCount, // `modifiedCount` tells how many were updated
//         });
//     } catch (error) {
//         console.error("Error during updating labels:", error);
//         res.status(500).json({
//             error: 'An error occurred while updating labels',
//             details: error.message,
//         });
//     }
// });