import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, MapPin, User as UserIcon, LogOut, LayoutDashboard, CreditCard, Plus, X, EarOff, MessageCircle, Heart } from 'lucide-react';
import { authApi } from '../api';
import { useLanguage } from "../context/LanguageContext";

export default function AccountPage() {
  const { user, logout, isAdmin, setUser } = useAuth();
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();

  const [activeModal, setActiveModal] = useState(null); // 'profile', 'addresses', 'payment'
  const [addressForm, setAddressForm] = useState({
    full_name: user?.name || '',
    phone: user?.phone || '',
    address_line1: '',
    city: '',
    governorate: '',
    country: 'Egypt',
    postal_code: '',
    is_hearing_impaired: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const onLogout = () => { logout(); navigate('/'); };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await authApi.addAddress(addressForm);
      setUser(res.data); // update global user state with new address
      setActiveModal(null);
      setAddressForm({ ...addressForm, address_line1: '', city: '', governorate: '', postal_code: '', is_hearing_impaired: false });
    } catch (err) {
      console.error(err);
      alert('Failed to add address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefaultAddress = async (index) => {
    try {
      const res = await authApi.setDefaultAddress(index);
      setUser(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to set default address');
    }
  };

  const EGYPT_REGIONS = {
    "Cairo": ["Cairo", "New Cairo", "Nasr City", "Heliopolis", "Maadi", "Zamalek", "Shoubra", "El Shorouk", "Badr City", "Rehab", "Madinaty"],
    "Giza": ["Giza", "6th of October", "Sheikh Zayed", "Dokki", "Mohandeseen", "Haram", "Faisal", "Agouza", "Hawamdiya"],
    "Alexandria": ["Alexandria", "Borg El Arab", "Agami", "Smouha", "Sidi Gaber", "Miami", "Montaza"],
    "Dakahlia": ["Mansoura", "Talkha", "Mit Ghamr", "Dekernes", "Aga", "Senbellawein"],
    "Red Sea": ["Hurghada", "Safaga", "Marsa Alam", "Ras Gharib", "El Qusiar"],
    "Beheira": ["Damanhour", "Kafr El Dawwar", "Rashid", "Edku", "Abu Hummus"],
    "Fayoum": ["Fayoum", "Atsa", "Tamiya", "Senoress"],
    "Gharbia": ["Tanta", "El Mahalla El Kubra", "Zifta", "Kafr El Zayat"],
    "Ismailia": ["Ismailia", "Fayed", "Qantara", "Tell El Kebir"],
    "Menofia": ["Shibin El Kom", "Menouf", "Ashmoun", "Sadat City", "Tala"],
    "Minya": ["Minya", "Maghagha", "Beni Mazar", "Samalut", "Abu Qurqas"],
    "Qalyubia": ["Banha", "Shubra El Kheima", "Qalyub", "Khanka", "Obour City"],
    "New Valley": ["Kharga", "Dakhla", "Farafra", "Baris"],
    "Suez": ["Suez", "Arbaeen", "Ataqah", "Ganayen"],
    "Aswan": ["Aswan", "Edfu", "Kom Ombo", "Daraw", "Abu Simbel"],
    "Assiut": ["Assiut", "Dairut", "Manfalut", "Abnub", "Abu Tig"],
    "Beni Suef": ["Beni Suef", "Nasser", "Ihnasiya", "Biba", "Al Fashn"],
    "Port Said": ["Port Said", "Port Fouad"],
    "Damietta": ["Damietta", "New Damietta", "Ras El Bar", "Faraskour", "Zarka"],
    "Sharkia": ["Zagazig", "10th of Ramadan", "Minya El Qamh", "Bilbeis", "Faqous"],
    "South Sinai": ["Sharm El Sheikh", "Dahab", "Nuweiba", "Taba", "El Tor"],
    "Kafr El Sheikh": ["Kafr El Sheikh", "Desouk", "Baltim", "Metoubes", "Fouah"],
    "Matrouh": ["Marsa Matrouh", "El Alamein", "Siwa", "Dabaa"],
    "Luxor": ["Luxor", "Esna", "Armant", "Karnak"],
    "Qena": ["Qena", "Nagaa Hammadi", "Qus", "Deshna", "Qift"],
    "North Sinai": ["Arish", "Sheikh Zuweid", "Rafah", "Bir al-Abed"],
    "Sohag": ["Sohag", "Akhmim", "Girga", "Tahta", "Balyana"]
  };

  const handleGovernorateChange = (e) => {
    setAddressForm({
      ...addressForm,
      governorate: e.target.value,
      city: '' // reset city when governorate changes
    });
  };

  return (
    <main className="account-page" data-testid="account-page">
      <div className="breadcrumb">
        <Link to="/">{t('nav_home')}</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{t('account_title')}</span>
      </div>

      <div className="account-header">
        <h1 className="account-title">{user.name}</h1>
        <p className="account-email">{user.email}</p>
      </div>

      <div className="account-grid">
        <Link to="/account/orders" className="account-card" data-testid="link-orders">
          <Package size={28} />
          <div>
            <h3>{t('account_orders')}</h3>
          </div>
        </Link>

        <Link to="/account/wishlist" className="account-card" data-testid="link-wishlist">
          <Heart size={28} />
          <div>
            <h3>{t('account_wishlist')}</h3>
          </div>
        </Link>

        <Link to="/account/edit" className="account-card" data-testid="link-profile">
          <UserIcon size={28} />
          <div>
            <h3>{t('account_profile')}</h3>
            <p>{user.name} · {user.phone || t('not_provided')}</p>
          </div>
        </Link>

        <div className="account-card" onClick={() => setActiveModal('addresses')} style={{ cursor: 'pointer' }}>
          <MapPin size={28} />
          <div>
            <h3>{t('account_addresses')}</h3>
            <p>{user.addresses?.length || 0} {t('account_addresses')}</p>
          </div>
        </div>

        <div className="account-card" onClick={() => setActiveModal('payment')} style={{ cursor: 'pointer' }}>
          <CreditCard size={28} />
          <div>
            <h3>{t('account_payment')}</h3>
          </div>
        </div>

        {isAdmin && (
          <Link to="/admin" className="account-card account-card-admin" data-testid="account-admin-link">
            <LayoutDashboard size={28} />
            <div>
              <h3>{t('nav_admin_dashboard')}</h3>
            </div>
          </Link>
        )}

        <button onClick={onLogout} className="account-card account-card-logout" data-testid="account-logout-btn">
          <LogOut size={28} />
          <div>
            <h3>{t('nav_logout')}</h3>
          </div>
        </button>
      </div>

      {/* Addresses Modal */}
      {activeModal === 'addresses' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveModal(null)}><X size={24} /></button>
            <h2>{t('account_addresses')}</h2>
            
            {user.addresses?.length > 0 ? (
              <div className="addresses-list" style={{ marginBottom: '24px' }}>
                {user.addresses.map((addr, i) => (
                  <div key={i} style={{ border: i === user.default_address_idx ? '2px solid var(--primary)' : '1px solid #eee', padding: '16px', borderRadius: '8px', marginBottom: '12px', position: 'relative' }}>
                    {i === user.default_address_idx && (
                      <span style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{t('default_address')}</span>
                    )}
                    <strong>{addr.full_name}</strong>
                    <p style={{ margin: '4px 0', color: '#666' }}>{addr.address_line1}, {addr.city}</p>
                    <p style={{ margin: 0, color: '#666' }}>{addr.governorate}, {addr.country} {addr.postal_code}</p>
                    <p style={{ margin: '4px 0 12px', color: '#666', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {t('addr_phone')}{addr.phone}
                      {addr.is_hearing_impaired && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eef2ff', color: '#4f46e5', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500' }}>
                          <EarOff size={12} /> {t('hearing_impaired_badge')}
                        </span>
                      )}
                    </p>
                    {i !== user.default_address_idx && (
                      <button className="btn-outline" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={() => handleSetDefaultAddress(i)}>
                        {t('set_default')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#666', marginBottom: '24px' }}>{t('no_addresses')}</p>
            )}

            <h3 style={{ borderTop: '1px solid #eee', paddingTop: '24px', marginTop: '12px' }}>{t('add_new_address')}</h3>
            <form onSubmit={handleAddAddress} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
              <div style={{ display: 'flex', gap: '16px', flexDirection: 'row' }}>
                <input type="text" placeholder={t('placeholder_full_name')} required className="form-input" value={addressForm.full_name} onChange={e => setAddressForm({...addressForm, full_name: e.target.value})} style={{ flex: 1, textAlign: lang === 'ar' ? 'right' : 'left' }} />
                <input type="tel" placeholder={t('placeholder_phone')} required className="form-input" value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} style={{ flex: 1, textAlign: lang === 'ar' ? 'right' : 'left', direction: 'ltr' }} />
              </div>
              <input type="text" placeholder={t('placeholder_street')} required className="form-input" value={addressForm.address_line1} onChange={e => setAddressForm({...addressForm, address_line1: e.target.value})} style={{ textAlign: lang === 'ar' ? 'right' : 'left' }} />
              <div style={{ display: 'flex', gap: '16px', flexDirection: 'row' }}>
                <select required className="form-input" value={addressForm.governorate} onChange={handleGovernorateChange} style={{ flex: 1, textAlign: lang === 'ar' ? 'right' : 'left' }}>
                  <option value="" disabled>{t('placeholder_gov')}</option>
                  {Object.keys(EGYPT_REGIONS).sort().map(gov => (
                    <option key={gov} value={gov}>{t(`gov_${gov}`, gov)}</option>
                  ))}
                </select>
                <select required className="form-input" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} style={{ flex: 1, textAlign: lang === 'ar' ? 'right' : 'left' }} disabled={!addressForm.governorate}>
                  <option value="" disabled>{t('placeholder_city')}</option>
                  {addressForm.governorate && EGYPT_REGIONS[addressForm.governorate].sort().map(city => (
                    <option key={city} value={city}>{t(`city_${city}`, city)}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '16px', flexDirection: 'row' }}>
                <input type="text" placeholder={t('placeholder_postal')} className="form-input" value={addressForm.postal_code} onChange={e => setAddressForm({...addressForm, postal_code: e.target.value})} style={{ flex: 1, textAlign: lang === 'ar' ? 'right' : 'left' }} />
                <input type="text" value={t('country_egypt')} disabled className="form-input" style={{ flex: 1, backgroundColor: '#f9f9f9', textAlign: lang === 'ar' ? 'right' : 'left' }} />
              </div>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#444', cursor: 'pointer', marginTop: '4px', flexDirection: 'row' }}>
                <input 
                  type="checkbox" 
                  checked={addressForm.is_hearing_impaired} 
                  onChange={e => setAddressForm({...addressForm, is_hearing_impaired: e.target.checked})} 
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }} 
                />
                <EarOff size={18} style={{ color: '#666' }} />
                <span>{t('label_hearing_impaired')}</span>
              </label>

              <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ marginTop: '8px' }}>
                {isSubmitting ? t('loading') : t('save')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Methods Modal */}
      {activeModal === 'payment' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveModal(null)}><X size={24} /></button>
            <h2>{t('account_payment')}</h2>
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#666' }}>
              <CreditCard size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
              <p>{t('no_saved_cards')}</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>{t('payment_notice')}</p>
            </div>
            <button className="btn-outline" style={{ width: '100%' }} onClick={() => { alert('Card storage will be available once the payment gateway is fully integrated.'); setActiveModal(null); }}>
              <Plus size={18} style={{ marginRight: lang === 'ar' ? '0' : '8px', marginLeft: lang === 'ar' ? '8px' : '0' }} /> {t('add_new_card')}
            </button>
          </div>
        </div>
      )}

      {/* Profile modal removed — use /account/edit */}

    </main>
  );
}
