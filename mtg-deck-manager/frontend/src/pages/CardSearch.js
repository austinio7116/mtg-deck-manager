import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Pagination,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
  CompareArrows as CompareArrowsIcon,
} from '@mui/icons-material';
import { cardApi } from '../api/api';

// Card colors
const COLORS = [
  { value: 'W', label: 'White', color: '#F8E7B9' },
  { value: 'U', label: 'Blue', color: '#B3CEEA' },
  { value: 'B', label: 'Black', color: '#B0AEAE' },
  { value: 'R', label: 'Red', color: '#EAA393' },
  { value: 'G', label: 'Green', color: '#C4D3B5' },
];

// Card types
const TYPES = [
  'Creature',
  'Planeswalker',
  'Instant',
  'Sorcery',
  'Artifact',
  'Enchantment',
  'Land',
];

// Card rarities
const RARITIES = [
  'common',
  'uncommon',
  'rare',
  'mythic',
];

// Filter fields
const FILTER_FIELDS = [
  { id: 'name', label: 'Name' },
  { id: 'type_line', label: 'Type' },
  { id: 'colors', label: 'Colors' },
  { id: 'rarity', label: 'Rarity' },
  { id: 'cmc', label: 'Mana Value' },
  { id: 'set_code', label: 'Set' },
];

// Filter operators
const FILTER_OPERATORS = [
  { id: 'is', label: 'is' },
  { id: 'contains', label: 'contains' },
  { id: 'starts_with', label: 'starts with' },
  { id: 'ends_with', label: 'ends with' },
  { id: 'greater_than', label: 'greater than', numericOnly: true },
  { id: 'less_than', label: 'less than', numericOnly: true },
  { id: 'equals', label: 'equals', numericOnly: true },
];

// Generate a unique ID for filter conditions
const generateId = () => Math.random().toString(36).substring(2, 11);

function FilterCondition({ condition, onChange, onDelete, fields, operators }) {
  const handleFieldChange = (e) => {
    const newField = e.target.value;
    const isNumeric = newField === 'cmc';
    
    // If switching to/from numeric field, adjust operator if needed
    let newOperator = condition.operator;
    if (isNumeric && !FILTER_OPERATORS.find(op => op.id === newOperator)?.numericOnly) {
      newOperator = 'equals';
    } else if (!isNumeric && FILTER_OPERATORS.find(op => op.id === newOperator)?.numericOnly) {
      newOperator = 'is';
    }
    
    onChange({
      ...condition,
      field: newField,
      operator: newOperator
    });
  };

  const handleOperatorChange = (e) => {
    onChange({
      ...condition,
      operator: e.target.value
    });
  };

  const handleValueChange = (e) => {
    onChange({
      ...condition,
      value: e.target.value
    });
  };

  // Filter operators based on field type
  const fieldType = condition.field === 'cmc' ? 'numeric' : 'text';
  const availableOperators = operators.filter(op => 
    !op.numericOnly || (op.numericOnly && fieldType === 'numeric')
  );

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
      <IconButton sx={{ color: 'text.secondary' }}>
        <DragIndicatorIcon />
      </IconButton>
      
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <Select
          value={condition.field}
          onChange={handleFieldChange}
          displayEmpty
        >
          {fields.map((field) => (
            <MenuItem key={field.id} value={field.id}>
              {field.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <Select
          value={condition.operator}
          onChange={handleOperatorChange}
          displayEmpty
        >
          {availableOperators.map((op) => (
            <MenuItem key={op.id} value={op.id}>
              {op.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <TextField
        size="small"
        value={condition.value}
        onChange={handleValueChange}
        type={fieldType === 'numeric' ? 'number' : 'text'}
        sx={{ flexGrow: 1 }}
      />
      
      <IconButton color="error" onClick={onDelete}>
        <DeleteIcon />
      </IconButton>
    </Box>
  );
}

function FilterGroup({ group, onChange, onDelete, level = 0 }) {
  const handleTypeToggle = () => {
    onChange({
      ...group,
      type: group.type === 'AND' ? 'OR' : 'AND'
    });
  };

  const handleConditionChange = (index, updatedCondition) => {
    const newConditions = [...group.conditions];
    newConditions[index] = updatedCondition;
    onChange({
      ...group,
      conditions: newConditions
    });
  };

  const handleConditionDelete = (index) => {
    const newConditions = group.conditions.filter((_, i) => i !== index);
    onChange({
      ...group,
      conditions: newConditions
    });
  };

  const handleSubgroupChange = (index, updatedGroup) => {
    const newGroups = [...group.groups];
    newGroups[index] = updatedGroup;
    onChange({
      ...group,
      groups: newGroups
    });
  };

  const handleSubgroupDelete = (index) => {
    const newGroups = group.groups.filter((_, i) => i !== index);
    onChange({
      ...group,
      groups: newGroups
    });
  };

  const addCondition = () => {
    onChange({
      ...group,
      conditions: [
        ...group.conditions,
        { id: generateId(), field: 'name', operator: 'contains', value: '' }
      ]
    });
  };

  const addSubgroup = () => {
    onChange({
      ...group,
      groups: [
        ...group.groups,
        {
          id: generateId(),
          type: 'OR',
          conditions: [{ id: generateId(), field: 'name', operator: 'contains', value: '' }],
          groups: []
        }
      ]
    });
  };

  return (
    <Box 
      sx={{ 
        border: level > 0 ? '1px solid' : 'none',
        borderColor: 'divider',
        borderRadius: 1,
        p: level > 0 ? 2 : 0,
        mb: 2,
        position: 'relative'
      }}
    >
      {level > 0 && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mr: 2 }}>
              {group.type === 'AND' ? 'All of the following are true:' : 'Any of the following are true:'}
            </Typography>
            
            <Tooltip title={`Toggle between AND/OR (currently: ${group.type})`}>
              <Button 
                size="small" 
                variant="contained"
                color={group.type === 'AND' ? 'primary' : 'secondary'}
                onClick={handleTypeToggle}
                startIcon={<CompareArrowsIcon />}
                sx={{ minWidth: 100 }}
              >
                {group.type}
              </Button>
            </Tooltip>
            
            <Box sx={{ flexGrow: 1 }} />
            
            <IconButton color="error" onClick={onDelete} size="small">
              <DeleteIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
        </>
      )}

      {/* Left vertical line to show grouping */}
      {level > 0 && (
        <Box 
          sx={{ 
            position: 'absolute', 
            left: 10, 
            top: 50, 
            bottom: 10, 
            width: 3, 
            bgcolor: group.type === 'AND' ? 'primary.light' : 'secondary.light',
            opacity: 0.5,
            borderRadius: 3
          }} 
        />
      )}

      <Box sx={{ pl: level > 0 ? 3 : 0 }}>
        {/* Conditions */}
        {group.conditions.map((condition, index) => (
          <FilterCondition
            key={condition.id}
            condition={condition}
            onChange={(updated) => handleConditionChange(index, updated)}
            onDelete={() => handleConditionDelete(index)}
            fields={FILTER_FIELDS}
            operators={FILTER_OPERATORS}
          />
        ))}

        {/* Subgroups */}
        {group.groups.map((subgroup, index) => (
          <FilterGroup
            key={subgroup.id}
            group={subgroup}
            onChange={(updated) => handleSubgroupChange(index, updated)}
            onDelete={() => handleSubgroupDelete(index)}
            level={level + 1}
          />
        ))}

        {/* Action buttons */}
        <Box sx={{ display: 'flex', mt: 2, gap: 2 }}>
          <Button
            startIcon={<AddIcon />}
            size="small"
            onClick={addCondition}
            variant="text"
            color="primary"
          >
            Add condition
          </Button>
          
          <Button
            startIcon={<AddIcon />}
            size="small"
            onClick={addSubgroup}
            variant="text"
            color="primary"
          >
            Add subgroup
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

// Recursive function to build query parameters from filter group
const buildQueryParamsFromGroup = (group, prefix = '') => {
  let params = {};
  
  // Process conditions in this group
  group.conditions.forEach((condition, index) => {
    if (condition.value) {
      const paramName = `${prefix}conditions[${index}]`;
      params[`${paramName}.field`] = condition.field;
      params[`${paramName}.operator`] = condition.operator;
      
      if (condition.field === 'cmc' && !isNaN(parseInt(condition.value))) {
        params[`${paramName}.value`] = parseInt(condition.value);
      } else {
        params[`${paramName}.value`] = condition.value;
      }
    }
  });
  
  // Process subgroups
  group.groups.forEach((subgroup, index) => {
    const subParams = buildQueryParamsFromGroup(
      subgroup, 
      `${prefix}groups[${index}].`
    );
    params[`${prefix}groups[${index}].type`] = subgroup.type;
    params = { ...params, ...subParams };
  });
  
  return params;
};

function CardSearch() {
  // Simple search parameters
  const [searchTerm, setSearchTerm] = useState('');
  
  // Advanced filter state
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [useAdvancedFilters, setUseAdvancedFilters] = useState(false);
  
  // Root filter group
  const [filterGroup, setFilterGroup] = useState({
    id: 'root',
    type: 'AND',
    conditions: [{ id: generateId(), field: 'name', operator: 'contains', value: '' }],
    groups: []
  });
  
  // Results state
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCards, setTotalCards] = useState(0);
  
  const cardsPerPage = 12;

  // Effect to search cards when parameters change
  useEffect(() => {
    searchCards();
  }, [page]);

  // Build query parameters from filter group
  const buildQueryParams = () => {
    const params = {
      skip: (page - 1) * cardsPerPage,
      limit: cardsPerPage,
    };
    
    if (!useAdvancedFilters) {
      // Simple search
      if (searchTerm) {
        params.name = searchTerm;
      }
      
      if (filtersVisible) {
        filterGroup.conditions.forEach(condition => {
          if (condition.value) {
            if (condition.field === 'cmc' && !isNaN(parseInt(condition.value))) {
              params[condition.field] = parseInt(condition.value);
            } else {
              params[condition.field] = condition.value;
            }
          }
        });
      }
      
      return params;
    }
    
    // Advanced search - build complex query
    params.filter_type = filterGroup.type;
    const filterParams = buildQueryParamsFromGroup(filterGroup);
    
    // For now, we'll just use a simplified approach for the backend
    // In a real implementation, you would send the full structure
    // and have the backend interpret it
    
    // Extract simple conditions for backward compatibility
    filterGroup.conditions.forEach(condition => {
      if (condition.value) {
        if (condition.field === 'cmc' && !isNaN(parseInt(condition.value))) {
          params[condition.field] = parseInt(condition.value);
        } else {
          params[condition.field] = condition.value;
        }
      }
    });
    
    // Add a debug parameter with the full filter structure
    params.filter_json = JSON.stringify(filterGroup);
    
    return params;
  };

  const searchCards = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build search parameters
      const params = buildQueryParams();
      const { cards: results, totalCount } = await cardApi.searchCards(params);
      setCards(results);
      setTotalCards(totalCount);
      
      // Calculate total pages based on the total count from the API
      const calculatedPages = Math.ceil(totalCount / cardsPerPage) || 1;
      console.log(`Total cards: ${totalCount}, Cards per page: ${cardsPerPage}, Total pages: ${calculatedPages}, Current page: ${page}`);
      setTotalPages(calculatedPages);
      
    } catch (err) {
      console.error('Error searching cards:', err);
      setError('Failed to search cards. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page
    searchCards();
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilterGroup({
      id: 'root',
      type: 'AND',
      conditions: [{ id: generateId(), field: 'name', operator: 'contains', value: '' }],
      groups: []
    });
    setPage(1);
    searchCards();
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  const toggleAdvancedFilters = () => {
    setUseAdvancedFilters(!useAdvancedFilters);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Card Search
      </Typography>

      {/* Search Form */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSearch}>
          <Grid container spacing={2} alignItems="flex-end">
            {!useAdvancedFilters && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Search Cards"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="clear search"
                          onClick={() => setSearchTerm('')}
                          edge="end"
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            )}
            <Grid item xs={12} md={useAdvancedFilters ? 12 : 6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={toggleAdvancedFilters}
                sx={{ mr: 1 }}
              >
                {useAdvancedFilters ? 'Simple Search' : 'Advanced Filters'}
              </Button>
              {!useAdvancedFilters && (
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={toggleFilters}
                  sx={{ mr: 1 }}
                >
                  {filtersVisible ? 'Hide Filters' : 'Show Filters'}
                </Button>
              )}
              <Button
                variant="outlined"
                onClick={handleClearSearch}
                sx={{ mr: 1 }}
              >
                Clear
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SearchIcon />}
              >
                Search
              </Button>
            </Grid>
          </Grid>

          {/* Advanced Filters */}
          {useAdvancedFilters && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Where:
              </Typography>
              <FilterGroup 
                group={filterGroup}
                onChange={setFilterGroup}
                onDelete={() => {}}
              />
            </Box>
          )}

          {/* Simple Filters */}
          {!useAdvancedFilters && filtersVisible && (
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Colors
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {COLORS.map((color) => (
                      <Chip
                        key={color.value}
                        label={color.label}
                        onClick={() => {
                          const colorCondition = filterGroup.conditions.find(c => c.field === 'colors');
                          if (colorCondition) {
                            const value = colorCondition.value || '';
                            const colors = value.split(',').filter(c => c);
                            let newColors;
                            if (colors.includes(color.value)) {
                              newColors = colors.filter(c => c !== color.value);
                            } else {
                              newColors = [...colors, color.value];
                            }
                            
                            const newConditions = filterGroup.conditions.map(c => 
                              c.field === 'colors' 
                                ? { ...c, value: newColors.join(',') } 
                                : c
                            );
                            
                            setFilterGroup({
                              ...filterGroup,
                              conditions: newConditions
                            });
                          } else {
                            setFilterGroup({
                              ...filterGroup,
                              conditions: [
                                ...filterGroup.conditions,
                                { id: generateId(), field: 'colors', operator: 'contains', value: color.value }
                              ]
                            });
                          }
                        }}
                        sx={{
                          bgcolor: (() => {
                            const colorCondition = filterGroup.conditions.find(c => c.field === 'colors');
                            if (colorCondition) {
                              const colors = colorCondition.value?.split(',') || [];
                              return colors.includes(color.value) ? color.color : 'default';
                            }
                            return 'default';
                          })(),
                          '&:hover': {
                            bgcolor: (() => {
                              const colorCondition = filterGroup.conditions.find(c => c.field === 'colors');
                              if (colorCondition) {
                                const colors = colorCondition.value?.split(',') || [];
                                return colors.includes(color.value) ? color.color : 'action.hover';
                              }
                              return 'action.hover';
                            })()
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel id="type-select-label">Card Type</InputLabel>
                    <Select
                      labelId="type-select-label"
                      value={(() => {
                        const typeCondition = filterGroup.conditions.find(c => c.field === 'type_line');
                        return typeCondition ? typeCondition.value : '';
                      })()}
                      label="Card Type"
                      onChange={(e) => {
                        const typeCondition = filterGroup.conditions.find(c => c.field === 'type_line');
                        if (typeCondition) {
                          const newConditions = filterGroup.conditions.map(c => 
                            c.field === 'type_line' 
                              ? { ...c, value: e.target.value } 
                              : c
                          );
                          
                          setFilterGroup({
                            ...filterGroup,
                            conditions: newConditions
                          });
                        } else {
                          setFilterGroup({
                            ...filterGroup,
                            conditions: [
                              ...filterGroup.conditions,
                              { id: generateId(), field: 'type_line', operator: 'contains', value: e.target.value }
                            ]
                          });
                        }
                      }}
                    >
                      <MenuItem value="">Any</MenuItem>
                      {TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel id="rarity-select-label">Rarity</InputLabel>
                    <Select
                      labelId="rarity-select-label"
                      value={(() => {
                        const rarityCondition = filterGroup.conditions.find(c => c.field === 'rarity');
                        return rarityCondition ? rarityCondition.value : '';
                      })()}
                      label="Rarity"
                      onChange={(e) => {
                        const rarityCondition = filterGroup.conditions.find(c => c.field === 'rarity');
                        if (rarityCondition) {
                          const newConditions = filterGroup.conditions.map(c => 
                            c.field === 'rarity' 
                              ? { ...c, value: e.target.value } 
                              : c
                          );
                          
                          setFilterGroup({
                            ...filterGroup,
                            conditions: newConditions
                          });
                        } else {
                          setFilterGroup({
                            ...filterGroup,
                            conditions: [
                              ...filterGroup.conditions,
                              { id: generateId(), field: 'rarity', operator: 'is', value: e.target.value }
                            ]
                          });
                        }
                      }}
                    >
                      <MenuItem value="">Any</MenuItem>
                      {RARITIES.map((rarity) => (
                        <MenuItem key={rarity} value={rarity}>
                          {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Mana Value (CMC)"
                    type="number"
                    value={(() => {
                      const cmcCondition = filterGroup.conditions.find(c => c.field === 'cmc');
                      return cmcCondition ? cmcCondition.value : '';
                    })()}
                    onChange={(e) => {
                      const cmcCondition = filterGroup.conditions.find(c => c.field === 'cmc');
                      if (cmcCondition) {
                        const newConditions = filterGroup.conditions.map(c => 
                          c.field === 'cmc' 
                            ? { ...c, value: e.target.value } 
                            : c
                        );
                        
                        setFilterGroup({
                          ...filterGroup,
                          conditions: newConditions
                        });
                      } else {
                        setFilterGroup({
                          ...filterGroup,
                          conditions: [
                            ...filterGroup.conditions,
                            { id: generateId(), field: 'cmc', operator: 'equals', value: e.target.value }
                          ]
                        });
                      }
                    }}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </form>
      </Paper>

      {/* Results */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : cards.length > 0 ? (
        <>
          <Typography variant="subtitle1" gutterBottom>
            Showing {cards.length} of {totalCards} results
          </Typography>
          <Grid container spacing={2}>
            {cards.map((card) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={card.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.03)',
                    },
                  }}
                  className="card-hover"
                >
                  <CardActionArea
                    component={RouterLink}
                    to={`/cards/${card.id}`}
                    sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                  >
                    {card.image_uri ? (
                      <CardMedia
                        component="img"
                        image={card.image_uri}
                        alt={card.name}
                        sx={{ aspectRatio: '0.716' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 0,
                          paddingTop: '139.6%', // MTG card aspect ratio
                          bgcolor: 'action.hover',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                            p: 1,
                          }}
                        >
                          {card.name}
                        </Typography>
                      </Box>
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" noWrap>
                        {card.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {card.type_line}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              siblingCount={1}
              boundaryCount={1}
            />
          </Box>
        </>
      ) : (
        <Alert severity="info">
          No cards found. Try adjusting your search criteria.
        </Alert>
      )}
    </Box>
  );
}

export default CardSearch;