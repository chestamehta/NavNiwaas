import { useState } from "react";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "../firebase";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function CreateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    imageUrls: [],
    name: "",
    description: "",
    address: "",
    type: "rent",
    bedrooms: 1,
    bathrooms: 1,
    regularPrice: 50,
    discountPrice: 0,
    offer: false,
    parking: false,
    furnished: false,
  });
  const [imageUploadError, setImageUploadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  console.log(formData);
  const handleImageSubmit = (e) => {
    if (files.length > 0 && files.length + formData.imageUrls.length < 7) {
      setUploading(true);
      setImageUploadError(false);
      const promises = [];

      for (let i = 0; i < files.length; i++) {
        promises.push(storeImage(files[i]));
      }
      Promise.all(promises)
        .then((urls) => {
          setFormData({
            ...formData,
            imageUrls: formData.imageUrls.concat(urls),
          });
          setImageUploadError(false);
          setUploading(false);
        })
        .catch((err) => {
          setImageUploadError("Image upload failed (2 mb max per image)");
          setUploading(false);
        });
    } else {
      setImageUploadError("You can only upload 6 images per listing");
      setUploading(false);
    }
  };

  const storeImage = async (file) => {
    return new Promise((resolve, reject) => {
      const storage = getStorage(app);
      const fileName = new Date().getTime() + file.name;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          });
        }
      );
    });
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, i) => i !== index),
    });
  };

  const handleChange = (e) => {
    if (e.target.id === "sale" || e.target.id === "rent") {
      setFormData({
        ...formData,
        type: e.target.id,
      });
    }

    if (
      e.target.id === "parking" ||
      e.target.id === "furnished" ||
      e.target.id === "offer"
    ) {
      setFormData({
        ...formData,
        [e.target.id]: e.target.checked,
      });
    }

    if (
      e.target.type === "number" ||
      e.target.type === "text" ||
      e.target.type === "textarea"
    ) {
      setFormData({
        ...formData,
        [e.target.id]: e.target.value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.imageUrls.length < 1)
        return setError("You must upload at least one image");
      if (+formData.regularPrice < +formData.discountPrice)
        return setError("Discount price must be lower than regular price");
      setLoading(true);
      setError(false);
      const res = await fetch("/api/listing/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          userRef: currentUser._id,
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success === false) {
        setError(data.message);
      }
      navigate(`/listing/${data._id}`);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };
  return (
    // <main className='p-3 max-w-4xl mx-auto'>
    //   <h1 className='text-3xl font-semibold text-center my-7'>
    //     Create a Listing
    //   </h1>
    //   <form onSubmit={handleSubmit} className='flex flex-col sm:flex-row gap-4'>
    //     <div className='flex flex-col gap-4 flex-1'>
    //       <input
    //         type='text'
    //         placeholder='Name'
    //         className='border p-3 rounded-lg'
    //         id='name'
    //         maxLength='62'
    //         minLength='10'
    //         required
    //         onChange={handleChange}
    //         value={formData.name}
    //       />
    //       <textarea
    //         type='text'
    //         placeholder='Description'
    //         className='border p-3 rounded-lg'
    //         id='description'
    //         required
    //         onChange={handleChange}
    //         value={formData.description}
    //       />
    //       <input
    //         type='text'
    //         placeholder='Address'
    //         className='border p-3 rounded-lg'
    //         id='address'
    //         required
    //         onChange={handleChange}
    //         value={formData.address}
    //       />
    //       <div className='flex gap-6 flex-wrap'>
    //         <div className='flex gap-2'>
    //           <input
    //             type='checkbox'
    //             id='sale'
    //             className='w-5'
    //             onChange={handleChange}
    //             checked={formData.type === 'sale'}
    //           />
    //           <span>Sell</span>
    //         </div>
    //         <div className='flex gap-2'>
    //           <input
    //             type='checkbox'
    //             id='rent'
    //             className='w-5'
    //             onChange={handleChange}
    //             checked={formData.type === 'rent'}
    //           />
    //           <span>Rent</span>
    //         </div>
    //         <div className='flex gap-2'>
    //           <input
    //             type='checkbox'
    //             id='parking'
    //             className='w-5'
    //             onChange={handleChange}
    //             checked={formData.parking}
    //           />
    //           <span>Parking spot</span>
    //         </div>
    //         <div className='flex gap-2'>
    //           <input
    //             type='checkbox'
    //             id='furnished'
    //             className='w-5'
    //             onChange={handleChange}
    //             checked={formData.furnished}
    //           />
    //           <span>Furnished</span>
    //         </div>
    //         <div className='flex gap-2'>
    //           <input
    //             type='checkbox'
    //             id='offer'
    //             className='w-5'
    //             onChange={handleChange}
    //             checked={formData.offer}
    //           />
    //           <span>Offer</span>
    //         </div>
    //       </div>
    //       <div className='flex flex-wrap gap-6'>
    //         <div className='flex items-center gap-2'>
    //           <input
    //             type='number'
    //             id='bedrooms'
    //             min='1'
    //             max='10'
    //             required
    //             className='p-3 border border-gray-300 rounded-lg'
    //             onChange={handleChange}
    //             value={formData.bedrooms}
    //           />
    //           <p>Beds</p>
    //         </div>
    //         <div className='flex items-center gap-2'>
    //           <input
    //             type='number'
    //             id='bathrooms'
    //             min='1'
    //             max='10'
    //             required
    //             className='p-3 border border-gray-300 rounded-lg'
    //             onChange={handleChange}
    //             value={formData.bathrooms}
    //           />
    //           <p>Baths</p>
    //         </div>
    //         <div className='flex items-center gap-2'>
    //           <input
    //             type='number'
    //             id='regularPrice'
    //             min='50'
    //             max='10000000'
    //             required
    //             className='p-3 border border-gray-300 rounded-lg'
    //             onChange={handleChange}
    //             value={formData.regularPrice}
    //           />
    //           <div className='flex flex-col items-center'>
    //             <p>Regular price</p>
    //             {formData.type === 'rent' && (
    //               <span className='text-xs'>($ / month)</span>
    //             )}
    //           </div>
    //         </div>
    //         {formData.offer && (
    //           <div className='flex items-center gap-2'>
    //             <input
    //               type='number'
    //               id='discountPrice'
    //               min='0'
    //               max='10000000'
    //               required
    //               className='p-3 border border-gray-300 rounded-lg'
    //               onChange={handleChange}
    //               value={formData.discountPrice}
    //             />
    //             <div className='flex flex-col items-center'>
    //               <p>Discounted price</p>

    //               {formData.type === 'rent' && (
    //                 <span className='text-xs'>($ / month)</span>
    //               )}
    //             </div>
    //           </div>
    //         )}
    //       </div>
    //     </div>
    //     <div className='flex flex-col flex-1 gap-4'>
    //       <p className='font-semibold'>
    //         Images:
    //         <span className='font-normal text-gray-600 ml-2'>
    //           The first image will be the cover (max 6)
    //         </span>
    //       </p>
    //       <div className='flex gap-4'>
    //         <input
    //           onChange={(e) => setFiles(e.target.files)}
    //           className='p-3 border border-gray-300 rounded w-full'
    //           type='file'
    //           id='images'
    //           accept='image/*'
    //           multiple
    //         />
    //         <button
    //           type='button'
    //           disabled={uploading}
    //           onClick={handleImageSubmit}
    //           className='p-3 text-green-700 border border-green-700 rounded uppercase hover:shadow-lg disabled:opacity-80'
    //         >
    //           {uploading ? 'Uploading...' : 'Upload'}
    //         </button>
    //       </div>
    //       <p className='text-red-700 text-sm'>
    //         {imageUploadError && imageUploadError}
    //       </p>
    //       {formData.imageUrls.length > 0 &&
    //         formData.imageUrls.map((url, index) => (
    //           <div
    //             key={url}
    //             className='flex justify-between p-3 border items-center'
    //           >
    //             <img
    //               src={url}
    //               alt='listing image'
    //               className='w-20 h-20 object-contain rounded-lg'
    //             />
    //             <button
    //               type='button'
    //               onClick={() => handleRemoveImage(index)}
    //               className='p-3 text-red-700 rounded-lg uppercase hover:opacity-75'
    //             >
    //               Delete
    //             </button>
    //           </div>
    //         ))}
    //       <button
    //         disabled={loading || uploading}
    //         className='p-3 bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 disabled:opacity-80'
    //       >
    //         {loading ? 'Creating...' : 'Create listing'}
    //       </button>
    //       {error && <p className='text-red-700 text-sm'>{error}</p>}
    //     </div>
    //   </form>
    // </main>
    <div
      className="min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: `url('https://wallpapers.com/images/hd/real-estate-buildings-in-modern-city-akg75n64dxflm7dk.jpg')`,
      }}
    >
      <main className="flex justify-center items-center h-full py-4">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 gap-6 w-full max-w-lg bg-white bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-lg p-6"
        >
          <h1 className="col-span-2 text-3xl font-bold text-center mb-6">
            Create Listings
          </h1>

          {/* Listing Name */}
          <div className="col-span-2">
            <label htmlFor="name" className="block font-semibold mb-1">
              Listing Name
            </label>
            <input
              type="text"
              id="name"
              className="w-full border p-2 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter listing name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label htmlFor="description" className="block font-semibold mb-1">
              Description
            </label>
            <textarea
              id="description"
              className="w-full border p-2 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          {/* Address */}
          <div className="col-span-2">
            <label htmlFor="address" className="block font-semibold mb-1">
              Address
            </label>
            <input
              type="text"
              id="address"
              className="w-full border p-2 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block font-semibold mb-1">Type</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="sale"
                  className="w-4 h-4 mr-2"
                  onChange={handleChange}
                  checked={formData.type === "sale"}
                />
                <label htmlFor="sale">Sell</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="rent"
                  className="w-4 h-4 mr-2"
                  onChange={handleChange}
                  checked={formData.type === "rent"}
                />
                <label htmlFor="rent">Rent</label>
              </div>
            </div>
          </div>

          {/* Bedrooms */}
          <div>
            <label htmlFor="bedrooms" className="block font-semibold mb-1">
              Bedrooms
            </label>
            <input
              type="number"
              id="bedrooms"
              min="1"
              max="10"
              className="w-full border p-2 rounded-lg focus:outline-none focus:border-blue-500"
              value={formData.bedrooms}
              onChange={handleChange}
              required
            />
          </div>

          {/* Bathrooms */}
          <div>
            <label htmlFor="bathrooms" className="block font-semibold mb-1">
              Bathrooms
            </label>
            <input
              type="number"
              id="bathrooms"
              min="1"
              max="10"
              className="w-full border p-2 rounded-lg focus:outline-none focus:border-blue-500"
              value={formData.bathrooms}
              onChange={handleChange}
              required
            />
          </div>

          {/* Regular Price */}
          <div>
            <label htmlFor="regularPrice" className="block font-semibold mb-1">
              Regular Price
            </label>
            <input
              type="number"
              id="regularPrice"
              min="50"
              max="10000000"
              className="w-full border p-2 rounded-lg focus:outline-none focus:border-blue-500"
              value={formData.regularPrice}
              onChange={handleChange}
              required
            />
          </div>

          {/* Discount Price */}
          {formData.offer && (
            <div>
              <label
                htmlFor="discountPrice"
                className="block font-semibold mb-1"
              >
                Discount Price
              </label>
              <input
                type="number"
                id="discountPrice"
                min="0"
                max="10000000"
                className="w-full border p-2 rounded-lg focus:outline-none focus:border-blue-500"
                value={formData.discountPrice}
                onChange={handleChange}
                required
              />
            </div>
          )}

          {/* Parking */}
          <div className="col-span-2 flex items-center">
            <input
              type="checkbox"
              id="parking"
              className="w-4 h-4 mr-2"
              onChange={handleChange}
              checked={formData.parking}
            />
            <label htmlFor="parking">Parking spot</label>
          </div>

          {/* Furnished */}
          <div className="col-span-2 flex items-center">
            <input
              type="checkbox"
              id="furnished"
              className="w-4 h-4 mr-2"
              onChange={handleChange}
              checked={formData.furnished}
            />
            <label htmlFor="furnished">Furnished</label>
          </div>

          {/* Offer */}
          <div className="col-span-2 flex items-center">
            <input
              type="checkbox"
              id="offer"
              className="w-4 h-4 mr-2"
              onChange={handleChange}
              checked={formData.offer}
            />
            <label htmlFor="offer">Offer</label>
          </div>

          {/* Image Upload */}
          <div className="col-span-2">
            <label className="block font-semibold mb-1">Images</label>
            <div className="flex items-center gap-4">
              <input
                onChange={(e) => setFiles(e.target.files)}
                className="p-2 border border-gray-300 rounded w-full"
                type="file"
                id="images"
                accept="image/*"
                multiple
              />
              <button
                type="button"
                disabled={uploading}
                onClick={handleImageSubmit}
                className="p-2 text-green-700 border border-green-700 rounded uppercase hover:shadow-lg disabled:opacity-80"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
            <p className="text-red-700 text-sm">
              {imageUploadError && imageUploadError}
            </p>
          </div>

          {/* Uploaded Images */}
          {formData.imageUrls.length > 0 &&
            formData.imageUrls.map((url, index) => (
              <div
                key={url}
                className="col-span-2 flex justify-between p-2 border items-center"
              >
                <img
                  src={url}
                  alt="listing image"
                  className="w-20 h-20 object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="p-2 text-red-700 rounded-lg uppercase hover:opacity-75"
                >
                  Delete
                </button>
              </div>
            ))}

          {/* Submit Button */}
          <button
            disabled={loading || uploading}
            className="col-span-2 p-3 bg-blue-500 text-white rounded-lg uppercase hover:bg-blue-600 disabled:opacity-80"
          >
            {loading ? "Creating..." : "Create Listing"}
          </button>

          {/* Error Message */}
          {error && <p className="col-span-2 text-red-700 text-sm">{error}</p>}
        </form>
      </main>
    </div>
  );
}
