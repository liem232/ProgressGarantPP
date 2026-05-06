import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin } from 'lucide-react';

interface AddressSuggestion {
  address: string;
  geo_lat: string;
  geo_lon: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Введите адрес...',
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  // Обновляем inputValue при изменении value снаружи
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Закрываем подсказки при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Пересчитываем позицию при изменении viewport (клавиатура на мобильных)
  useEffect(() => {
    if (showSuggestions && inputWrapperRef.current) {
      const handleResize = () => {
        updateDropdownPosition();
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize);
      
      // Для мобильных устройств с visualViewport
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleResize);
        window.visualViewport.addEventListener('scroll', handleResize);
      }

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleResize);
          window.visualViewport.removeEventListener('scroll', handleResize);
        }
      };
    }
  }, [showSuggestions]);

  // Очистка таймаута при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Используем Яндекс Геокодер API
      // Формируем запрос с ограничением по Оренбургу
      const searchQuery = `Оренбург ${query}`;
      const response = await fetch(
        `https://geocode-maps.yandex.ru/1.x/?apikey=${import.meta.env.VITE_YANDEX_API_KEY || ''}&format=json&geocode=${encodeURIComponent(searchQuery)}&results=5&kind=house&rspn=1&ll=55.0977,51.7682&spn=0.5,0.5`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      
      if (data.response && data.response.GeoObjectCollection && data.response.GeoObjectCollection.featureMember) {
        const addresses = data.response.GeoObjectCollection.featureMember.map((item: any) => {
          const geoObject = item.GeoObject;
          const addressDetails = geoObject.metaDataProperty.GeocoderMetaData.AddressDetails;
          const country = addressDetails?.Country;
          const locality = country?.Locality;
          
          // Формируем читаемый адрес
          let address = geoObject.name || '';
          if (locality && locality.LocalityName && !address.includes(locality.LocalityName)) {
            address = `${locality.LocalityName}, ${address}`;
          }
          
          const pos = geoObject.Point.pos.split(' ');
          
          return {
            address: address,
            geo_lat: pos[1],
            geo_lon: pos[0]
          };
        });

        // Фильтруем только уникальные адреса
        const uniqueAddresses = addresses.filter((addr: AddressSuggestion, index: number, self: AddressSuggestion[]) =>
          index === self.findIndex((a) => a.address === addr.address)
        );

        setSuggestions(uniqueAddresses);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDropdownPosition = () => {
    if (inputWrapperRef.current) {
      const rect = inputWrapperRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setShowSuggestions(true);
    updateDropdownPosition();

    // Debounce запроса
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    setInputValue(suggestion.address);
    onChange(suggestion.address);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <div ref={inputWrapperRef} className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`pl-10 ${className}`}
          onFocus={() => {
            if (inputValue.length >= 3) {
              updateDropdownPosition();
              setShowSuggestions(true);
            }
          }}
          onClick={() => {
            updateDropdownPosition();
            if (inputValue.length >= 3 && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 &&
        ReactDOM.createPortal(
          <div 
            className="fixed z-[9999] bg-background border rounded-md shadow-lg max-h-60 overflow-auto"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
            }}
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-start gap-2 border-b last:border-b-0"
              >
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-sm">{suggestion.address}</span>
              </button>
            ))}
          </div>,
          document.body
        )
      }
    </div>
  );
};

export default AddressAutocomplete;
