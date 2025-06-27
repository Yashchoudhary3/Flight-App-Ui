import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../config/supabase';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { toast } from 'react-hot-toast';

const paymentFields = [
  { label: 'Card Number', name: 'card_number', type: 'text' },
  { label: 'Card Expiry', name: 'card_expiry', type: 'text' },
  { label: 'Card Holder Name', name: 'card_holder', type: 'text' },
  { label: 'UPI ID', name: 'upi_id', type: 'text' },
];

const LOCAL_FIELDS = ['first_name', 'last_name', 'email', 'phone'];

const Profile = () => {
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    date_of_birth: '',
    card_number: '',
    card_expiry: '',
    card_holder: '',
    upi_id: '',
  });

  // Prefill from localStorage if available
  useEffect(() => {
    const localData = {};
    LOCAL_FIELDS.forEach((field) => {
      const value = localStorage.getItem(field);
      if (value) localData[field] = value;
    });
    setFormData((prev) => ({ ...prev, ...localData }));
  }, []);

  useEffect(() => {
    fetchUserProfile();
    // eslint-disable-next-line
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      setFormData((prev) => ({
        ...prev,
        ...data,
        email: user.email,
      }));
    } catch (error) {
      toast.error('Error fetching profile');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          date_of_birth: formData.date_of_birth,
          card_number: formData.card_number,
          card_expiry: formData.card_expiry,
          card_holder: formData.card_holder,
          upi_id: formData.upi_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;
      // Update localStorage for key fields
      LOCAL_FIELDS.forEach((field) => {
        if (formData[field]) {
          localStorage.setItem(field, formData[field]);
        }
      });
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      toast.error('Error updating profile');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
          <div className="flex items-center justify-between px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-black">Profile</h3>
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                data-testid="edit-profile-btn"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* VIEW MODE */}
          {!editing && (
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-4 gap-x-8 sm:grid-cols-2">
                <div>
                  <div className="text-sm font-medium text-black">First Name</div>
                  <div className="text-lg text-black font-semibold">{formData.first_name || '-'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-black">Last Name</div>
                  <div className="text-lg text-black font-semibold">{formData.last_name || '-'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-black">Email</div>
                  <div className="text-lg text-black font-semibold">{formData.email || '-'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-black">Phone</div>
                  <div className="text-lg text-black font-semibold">{formData.phone || '-'}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-sm font-medium text-black">Address</div>
                  <div className="text-lg text-black font-semibold">{formData.address || '-'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-black">City</div>
                  <div className="text-lg text-black font-semibold">{formData.city || '-'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-black">Country</div>
                  <div className="text-lg text-black font-semibold">{formData.country || '-'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-black">Date of Birth</div>
                  <div className="text-lg text-black font-semibold">{formData.date_of_birth || '-'}</div>
                </div>
              </div>
              <div className="mt-8">
                <h4 className="text-md font-semibold text-black mb-2">Payment Details</h4>
                <div className="grid grid-cols-1 gap-y-2 gap-x-8 sm:grid-cols-2">
                  {paymentFields.map((field) => (
                    <div key={field.name}>
                      <div className="text-sm font-medium text-black">{field.label}</div>
                      <div className="text-lg text-black font-semibold">{formData[field.name] || '-'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* EDIT MODE */}
          {editing && (
            <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-black">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    id="first_name"
                    value={formData.first_name || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-black">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    id="last_name"
                    value={formData.last_name || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-black">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black bg-gray-100"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-black">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-black">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    value={formData.address || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-black">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    id="city"
                    value={formData.city || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-black">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    id="country"
                    value={formData.country || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
                <div>
                  <label htmlFor="date_of_birth" className="block text-sm font-medium text-black">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    id="date_of_birth"
                    value={formData.date_of_birth || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
              </div>
              <div className="mt-8">
                <h4 className="text-md font-semibold text-black mb-2">Payment Details</h4>
                <div className="grid grid-cols-1 gap-y-4 gap-x-8 sm:grid-cols-2">
                  {paymentFields.map((field) => (
                    <div key={field.name}>
                      <label htmlFor={field.name} className="block text-sm font-medium text-black">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        name={field.name}
                        id={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-black focus:border-black"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    fetchUserProfile();
                  }}
                  className="bg-gray-200 text-black px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  Save
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 