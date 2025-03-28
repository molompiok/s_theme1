import { Popover, PopoverTrigger, PopoverContent } from './Popover';
import { useSelectedFiltersStore } from '../store/filter';
import { defaultOptions, OptionType } from '../pages/type';

interface FilterPopoverProps {
  className?: string;
}

const FilterPopover = ({ className = '' }: FilterPopoverProps) => {
  const setFilter = useSelectedFiltersStore(state => state.setFilter);
  const selectedFilters = useSelectedFiltersStore(state => state.selectedFilters);


  const handleClick = (option: OptionType) => {
    console.log("🚀 ~ handleClick ~ option:", option)
    setFilter('order_by', [option]);
   
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className={`flex items-center gap-2  px-2 py-1 text-sm lg:text-base border-gray-500 bg-white/90 border rounded-sm ${className}`}
        >
          <span className='text-gray-500'>Trier par</span>
          <span className='text-gray-900'>{selectedFilters['order_by']}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="z-50 w-48 p-0">
        <div className="bg-white border border-gray-300 rounded-sm py-2">
          {defaultOptions.map((option) => (
            <button
              key={option}
              onClick={() => handleClick(option)}
              className="w-full text-sm text-left px-4 py-2 hover:bg-gray-100"
            >
              {option}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FilterPopover;