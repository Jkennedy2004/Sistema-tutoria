'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Filter, 
  X, 
  Search, 
  Calendar, 
  User, 
  MessageSquare, 
  Clock, 
  Star,
  Save,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Tag,
  Bookmark
} from 'lucide-react'

interface FilterOption {
  id: string
  label: string
  value: string
  count?: number
}

interface FilterGroup {
  id: string
  title: string
  type: 'select' | 'multiselect' | 'date' | 'search' | 'toggle'
  options?: FilterOption[]
  placeholder?: string
  icon?: React.ReactNode
}

interface AdvancedFiltersProps {
  filters: FilterGroup[]
  activeFilters: Record<string, any>
  onFilterChange: (filters: Record<string, any>) => void
  onClearFilters: () => void
  resultsCount: number
  totalCount: number
  loading?: boolean
  userType: 'student' | 'tutor'
  content: {
    filters: {
      title: string
      clearAll: string
      apply: string
      saveFilters: string
      savedFilters: string
      noResults: string
      resultsFound: string
      loading: string
      searchPlaceholder: string
      dateFrom: string
      dateTo: string
      status: {
        all: string
        read: string
        unread: string
        sent: string
        received: string
        edited: string
      }
      priority: {
        all: string
        high: string
        normal: string
        low: string
      }
      type: {
        all: string
        text: string
        file: string
        image: string
      }
    }
    messages: {
      noResults: string
      noResultsDescription: string
      tryDifferentFilters: string
    }
  }
}

export function AdvancedFilters({
  filters,
  activeFilters,
  onFilterChange,
  onClearFilters,
  resultsCount,
  totalCount,
  loading = false,
  userType,
  content
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [savedFilters, setSavedFilters] = useState<Array<{
    id: string
    name: string
    filters: Record<string, any>
    createdAt: string
  }>>([])
  const [showSavedFilters, setShowSavedFilters] = useState(false)
  const [filterName, setFilterName] = useState('')

  // Load saved filters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`saved-filters-${userType}`)
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading saved filters:', error)
      }
    }
  }, [userType])

  // Save filters to localStorage
  const saveCurrentFilters = () => {
    if (!filterName.trim()) return

    const newSavedFilter = {
      id: Date.now().toString(),
      name: filterName.trim(),
      filters: { ...activeFilters },
      createdAt: new Date().toISOString()
    }

    const updatedSavedFilters = [...savedFilters, newSavedFilter]
    setSavedFilters(updatedSavedFilters)
    localStorage.setItem(`saved-filters-${userType}`, JSON.stringify(updatedSavedFilters))
    setFilterName('')
    setShowSavedFilters(false)
  }

  // Load saved filter
  const loadSavedFilter = (savedFilter: any) => {
    onFilterChange(savedFilter.filters)
    setShowSavedFilters(false)
  }

  // Delete saved filter
  const deleteSavedFilter = (filterId: string) => {
    const updatedSavedFilters = savedFilters.filter(f => f.id !== filterId)
    setSavedFilters(updatedSavedFilters)
    localStorage.setItem(`saved-filters-${userType}`, JSON.stringify(updatedSavedFilters))
  }

  // Handle filter change
  const handleFilterChange = (filterId: string, value: any) => {
    const newFilters = { ...activeFilters }
    
    if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      delete newFilters[filterId]
    } else {
      newFilters[filterId] = value
    }
    
    onFilterChange(newFilters)
  }

  // Check if any filters are active
  const hasActiveFilters = Object.keys(activeFilters).length > 0

  // Get filter display value
  const getFilterDisplayValue = (filterId: string) => {
    const value = activeFilters[filterId]
    if (!value) return null

    const filter = filters.find(f => f.id === filterId)
    if (!filter) return value

    if (Array.isArray(value)) {
      return value.map(v => {
        const option = filter.options?.find(opt => opt.value === v)
        return option?.label || v
      }).join(', ')
    }

    const option = filter.options?.find(opt => opt.value === value)
    return option?.label || value
  }

  // Auto-complete suggestions for search filters
  const getSearchSuggestions = (filterId: string, query: string) => {
    const filter = filters.find(f => f.id === filterId)
    if (!filter?.options || !query) return []

    return filter.options
      .filter(option => 
        option.label.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Filter Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">{content.filters.title}</h3>
            {hasActiveFilters && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                {Object.keys(activeFilters).length}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Results Count */}
            <div className="text-sm text-gray-600">
              {loading ? (
                <div className="flex items-center space-x-1">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{content.filters.loading}</span>
                </div>
              ) : (
                <span>
                  {resultsCount} {content.filters.resultsFound} {totalCount}
                </span>
              )}
            </div>

            {/* Expand/Collapse */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={isExpanded ? 'Colapsar filtros' : 'Expandir filtros'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-blue-900">Filtros Activos</h4>
                <button
                  onClick={onClearFilters}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <X className="w-3 h-3" />
                  <span>{content.filters.clearAll}</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(activeFilters).map(([filterId, value]) => {
                  const displayValue = getFilterDisplayValue(filterId)
                  if (!displayValue) return null

                  return (
                    <span
                      key={filterId}
                      className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                    >
                      <Tag className="w-3 h-3" />
                      <span>{displayValue}</span>
                      <button
                        onClick={() => handleFilterChange(filterId, null)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Filter Groups */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filters.map((filterGroup) => (
              <div key={filterGroup.id} className="space-y-2">
                <div className="flex items-center space-x-2">
                  {filterGroup.icon}
                  <label className="text-sm font-medium text-gray-700">
                    {filterGroup.title}
                  </label>
                </div>

                {/* Filter Controls */}
                {filterGroup.type === 'select' && (
                  <select
                    value={activeFilters[filterGroup.id] || ''}
                    onChange={(e) => handleFilterChange(filterGroup.id, e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">{filterGroup.placeholder || 'Seleccionar...'}</option>
                    {filterGroup.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} {option.count ? `(${option.count})` : ''}
                      </option>
                    ))}
                  </select>
                )}

                {filterGroup.type === 'multiselect' && (
                  <div className="space-y-2">
                    <select
                      multiple
                      value={activeFilters[filterGroup.id] || []}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value)
                        handleFilterChange(filterGroup.id, selectedOptions.length > 0 ? selectedOptions : null)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      size={4}
                    >
                      {filterGroup.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} {option.count ? `(${option.count})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {filterGroup.type === 'search' && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder={filterGroup.placeholder || content.filters.searchPlaceholder}
                      value={activeFilters[filterGroup.id] || ''}
                      onChange={(e) => handleFilterChange(filterGroup.id, e.target.value || null)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    {/* Auto-complete suggestions */}
                    {activeFilters[filterGroup.id] && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                        {getSearchSuggestions(filterGroup.id, activeFilters[filterGroup.id]).map((suggestion) => (
                          <button
                            key={suggestion.value}
                            onClick={() => handleFilterChange(filterGroup.id, suggestion.value)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                          >
                            {suggestion.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {filterGroup.type === 'date' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        {content.filters.dateFrom}
                      </label>
                      <input
                        type="date"
                        value={activeFilters[`${filterGroup.id}_from`] || ''}
                        onChange={(e) => handleFilterChange(`${filterGroup.id}_from`, e.target.value || null)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        {content.filters.dateTo}
                      </label>
                      <input
                        type="date"
                        value={activeFilters[`${filterGroup.id}_to`] || ''}
                        onChange={(e) => handleFilterChange(`${filterGroup.id}_to`, e.target.value || null)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                  </div>
                )}

                {filterGroup.type === 'toggle' && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={filterGroup.id}
                      checked={!!activeFilters[filterGroup.id]}
                      onChange={(e) => handleFilterChange(filterGroup.id, e.target.checked ? true : null)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={filterGroup.id} className="text-sm text-gray-700">
                      {filterGroup.placeholder}
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Save Filters Section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bookmark className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{content.filters.savedFilters}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                {hasActiveFilters && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Nombre del filtro"
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={saveCurrentFilters}
                      disabled={!filterName.trim()}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
                    >
                      <Save className="w-3 h-3" />
                      <span>{content.filters.saveFilters}</span>
                    </button>
                  </div>
                )}
                
                <button
                  onClick={() => setShowSavedFilters(!showSavedFilters)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center space-x-1"
                >
                  <Bookmark className="w-3 h-3" />
                  <span>{savedFilters.length}</span>
                </button>
              </div>
            </div>

            {/* Saved Filters Dropdown */}
            {showSavedFilters && savedFilters.length > 0 && (
              <div className="mt-3 bg-gray-50 rounded-lg p-3">
                <div className="space-y-2">
                  {savedFilters.map((savedFilter) => (
                    <div key={savedFilter.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2">
                        <Bookmark className="w-3 h-3 text-blue-500" />
                        <span className="text-sm font-medium">{savedFilter.name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(savedFilter.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => loadSavedFilter(savedFilter)}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          Cargar
                        </button>
                        <button
                          onClick={() => deleteSavedFilter(savedFilter.id)}
                          className="px-2 py-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {!loading && resultsCount === 0 && hasActiveFilters && (
        <div className="px-4 py-3 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                {content.messages.noResults}
              </p>
              <p className="text-xs text-yellow-700">
                {content.messages.noResultsDescription}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <button
              onClick={onClearFilters}
              className="text-xs text-yellow-700 hover:text-yellow-800 underline"
            >
              {content.messages.tryDifferentFilters}
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {!loading && resultsCount > 0 && hasActiveFilters && (
        <div className="px-4 py-2 bg-green-50 border-t border-green-200">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800">
              {resultsCount} {content.filters.resultsFound} {totalCount}
            </span>
          </div>
        </div>
      )}
    </div>
  )
} 