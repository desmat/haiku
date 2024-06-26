#!/usr/bin/env bash
# declare an array variable
# declare -a mahabharata=("Krishna" "Yudhishthira" "Bheema" "Arjuna" "Draupadi" "Duryodhana")
 
# # get length of an array
# length=${#mahabharata[@]}
 
VotePedro="Vote for Pedro"
votePedroArray=(${VotePedro})
length=${#votePedroArray[@]}


# use C style for loop syntax to read all values and indexes
for (( j=0; j<length; j++ ));
do
  printf "Current index %d with value %s\n" $j "${votePedroArray[$j]}"
done
