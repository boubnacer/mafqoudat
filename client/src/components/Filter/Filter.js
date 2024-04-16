// import React, { useEffect, useState } from "react";
// import { useDispatch } from "react-redux";
// import { CATEGORIES } from "../../../config/categories";
// import { FOUNDLOST } from "../../../config/foundsOptions";
// import { sendFilters } from "../../../features/posts/postsSlice";

import React from "react";

const Filter = () => {
  return <div>Filter</div>;
};

export default Filter;
// const Filter = () => {
//   const dispatch = useDispatch();
//   const [foundLost, setFoundLost] = useState("");
//   const [category, setCategory] = useState("");

//   const onFoundLostChanged = (e) => setFoundLost(e.target.value);
//   const onCategoryChanged = (e) => setCategory(e.target.value);

//   const foundLostOptions = FOUNDLOST.map((item) => {
//     return (
//       <option key={item} value={item}>
//         {item}
//       </option>
//     );

//   const categoryOptions = CATEGORIES.map((catego) => {
//     return (
//       <option key={catego} value={catego}>
//         {catego}
//       </option>
//     );
//   });

//   useEffect(() => {
//     dispatch(sendFilters({ category, foundLost }));
//   }, [category, foundLost]);

//   return (
//     <div>
//       <form onClick={(e) => e.preventDefault()}>
//         <lable>found or lost ?</lable>
//         <select
//           id="foundLost"
//           className="form__select"
//           value={foundLost}
//           onChange={onFoundLostChanged}
//         >
//           {foundLostOptions}
//         </select>
//         <lable>what is it ?</lable>
//         <select
//           id="category"
//           className="form__select"
//           value={category}
//           onChange={onCategoryChanged}
//         >
//           {categoryOptions}
//         </select>
//       </form>
//     </div>
//   );
// };

// export default Filter;
